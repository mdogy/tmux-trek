#!/usr/bin/env node

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { parsePrompts, getAssetFolder } from './parse-prompts.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.join(__dirname, '..');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForElement(page, selector, timeout = 10000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch {
    return false;
  }
}

async function generateAssets() {
  const prompts = parsePrompts();
  console.log(`Found ${prompts.length} prompts to generate.\n`);

  // Create asset folders if they don't exist
  const folders = new Set();
  prompts.forEach(p => {
    const folder = getAssetFolder(p.category, p.subcategory);
    folders.add(folder);
  });

  folders.forEach(folder => {
    const folderPath = path.join(projectRoot, 'assets', folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`Created folder: assets/${folder}/`);
    }
  });

  console.log('');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.createBrowserContext();
  const page = await context.newPage();

  // Set up download handler
  const downloadPath = path.join(projectRoot, 'downloads');
  if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath, { recursive: true });
  }

  await context.grantPermissions(['clipboard-read', 'clipboard-write']);

  let generatedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i];
    const folder = getAssetFolder(prompt.category, prompt.subcategory);
    const outputPath = path.join(projectRoot, 'assets', folder, `${prompt.filename}.png`);

    console.log(`\n[${i + 1}/${prompts.length}] ${prompt.title}`);
    console.log(`Category: ${prompt.category}${prompt.subcategory ? ' > ' + prompt.subcategory : ''}`);
    console.log(`Output: assets/${folder}/${prompt.filename}.png`);

    // Skip if already generated
    if (fs.existsSync(outputPath)) {
      console.log('⏭️  Already exists, skipping.');
      skippedCount++;
      continue;
    }

    console.log('Generating...');

    try {
      // Navigate to Gemini on first run or if we need to restart
      if (page.url() === 'about:blank' || i === 0) {
        console.log('Opening Google Gemini...');
        await page.goto('https://gemini.google.com', { waitUntil: 'networkidle', timeout: 30000 });

        // Wait for user to authorize if needed
        const authCheck = await page.$('[data-testid="user-avatar"]');
        if (!authCheck) {
          console.log('⚠️  Please authorize Gemini in the browser window.');
          console.log('Waiting for authorization...');
          // Wait up to 2 minutes for user to authorize
          let authorized = false;
          for (let wait = 0; wait < 120; wait++) {
            await sleep(1000);
            const avatar = await page.$('[data-testid="user-avatar"]');
            if (avatar) {
              authorized = true;
              console.log('✅ Authorization detected.');
              break;
            }
          }
          if (!authorized) {
            console.error('❌ Authorization timeout. Skipping remaining prompts.');
            break;
          }
        } else {
          console.log('✅ Already authorized.');
        }

        // Wait for the chat input to be ready
        await sleep(2000);
      }

      // Click on the text input field (Gemini's chat input)
      const inputSelector = 'textarea[aria-label="Message"], textarea.input-textbox, textarea[placeholder*="Message"], [role="textbox"]';
      const inputFound = await page.$(inputSelector);

      if (!inputFound) {
        console.log('⚠️  Could not find input field. Manual intervention may be needed.');
        console.log('Waiting 5 seconds before continuing...');
        await sleep(5000);
        continue;
      }

      // Clear and type the prompt
      await page.click(inputSelector);
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Backspace');
      await sleep(500);

      console.log('Typing prompt...');
      await page.type(inputSelector, prompt.prompt, { delay: 1 });

      await sleep(1000);

      // Send the message
      const sendButtonSelector = 'button[aria-label="Send message"], button[data-tooltip="Send"], [aria-label*="Send"]';
      const sendBtn = await page.$(sendButtonSelector);

      if (sendBtn) {
        await sendBtn.click();
      } else {
        // Try pressing Enter as fallback
        await page.keyboard.press('Enter');
      }

      console.log('Waiting for image generation...');

      // Wait for the image to appear in the response
      // Look for image elements in the latest response
      await sleep(2000); // Give it a moment to start generating

      let imageGenerated = false;
      let waitTime = 0;
      const maxWait = 120000; // 2 minutes

      while (waitTime < maxWait) {
        // Look for newly generated images
        const images = await page.$$('img[src*="lh3.googleusercontent.com"], img[src*="data:image"]');
        if (images.length > 0) {
          // Check if we have a new image compared to before
          imageGenerated = true;
          break;
        }

        // Also look for any image that's loaded recently
        const allImages = await page.$$('img');
        if (allImages.length > 0) {
          const lastImg = allImages[allImages.length - 1];
          const src = await lastImg.getAttribute('src');
          if (src && (src.includes('lh3.googleusercontent.com') || src.includes('data:image'))) {
            imageGenerated = true;
            break;
          }
        }

        await sleep(500);
        waitTime += 500;
      }

      if (!imageGenerated) {
        console.log('⚠️  Image generation timed out or not detected.');
        console.log('Attempting to download anyway...');
        await sleep(2000);
      }

      // Try to find and download the image
      const images = await page.$$eval('img[src*="lh3.googleusercontent.com"], img[src*="data:image"]', imgs =>
        imgs.map(img => ({
          src: img.src,
          alt: img.alt
        }))
      );

      if (images.length > 0) {
        const imageUrl = images[images.length - 1].src; // Get the last image (most recent)

        console.log('Downloading image...');

        // Download the image
        const response = await page.context().request.get(imageUrl);
        const buffer = await response.body();

        // Save to output path
        fs.writeFileSync(outputPath, buffer);
        console.log(`✅ Saved to assets/${folder}/${prompt.filename}.png`);
        generatedCount++;

        // Rate limiting: wait between requests
        await sleep(2000);
      } else {
        console.log('⚠️  Could not find generated image. Skipping.');
      }
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Generated: ${generatedCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Failed: ${prompts.length - generatedCount - skippedCount}`);
  console.log(`Total: ${prompts.length}`);

  await browser.close();
}

generateAssets().catch(console.error);
