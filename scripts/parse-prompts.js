#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Parse the image-generation-prompts.md file and extract all prompts with their categories.
function parsePrompts() {
  const filePath = path.join(process.cwd(), 'docs/assets/image-generation-prompts.md');
  const content = fs.readFileSync(filePath, 'utf-8');

  const prompts = [];
  let currentCategory = null;
  let currentSubcategory = null;

  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match main category headers (## ...)
    const mainMatch = line.match(/^## (.+)$/);
    if (mainMatch) {
      currentCategory = mainMatch[1].trim();
      currentSubcategory = null;
      continue;
    }

    // Match subcategory headers (### ...)
    const subMatch = line.match(/^### (.+)$/);
    if (subMatch) {
      currentSubcategory = subMatch[1].trim();
      continue;
    }

    // Match prompt titles (**title**)
    const titleMatch = line.match(/^\*\*(.+?)\*\*$/);
    if (titleMatch) {
      const title = titleMatch[1].trim();

      // Next non-empty line should be the prompt in a blockquote
      let promptText = '';
      for (let j = i + 1; j < lines.length; j++) {
        const nextLine = lines[j];
        if (nextLine.startsWith('> ')) {
          promptText = nextLine.substring(2).trim();
          // Continue collecting multiline prompts
          while (j + 1 < lines.length && lines[j + 1].startsWith('> ')) {
            j++;
            promptText += ' ' + lines[j].substring(2).trim();
          }
          i = j;
          break;
        } else if (nextLine.trim() === '') {
          continue;
        } else {
          break;
        }
      }

      if (promptText) {
        prompts.push({
          title,
          prompt: promptText,
          category: currentCategory,
          subcategory: currentSubcategory,
          filename: sanitizeFilename(title)
        });
      }
    }
  }

  return prompts;
}

function sanitizeFilename(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

// Map category/subcategory to asset folder
function getAssetFolder(category, subcategory) {
  const categoryKey = category.toLowerCase();

  if (categoryKey.includes('character') || categoryKey.includes('companion') || categoryKey.includes('npc')) {
    return 'sprites';
  } else if (categoryKey.includes('terrain') || categoryKey.includes('wall') || categoryKey.includes('rift') || categoryKey.includes('props') || categoryKey.includes('item')) {
    return 'tiles';
  } else if (categoryKey.includes('glyph') || categoryKey.includes('ui')) {
    return 'ui';
  } else if (categoryKey.includes('background') || categoryKey.includes('panorama')) {
    return 'backgrounds';
  } else if (categoryKey.includes('vfx')) {
    return 'vfx';
  }

  return 'sprites'; // default
}

if (process.argv[2] === '--json') {
  console.log(JSON.stringify(parsePrompts(), null, 2));
} else {
  const prompts = parsePrompts();
  console.log(`Found ${prompts.length} prompts:\n`);
  prompts.forEach((p, i) => {
    const folder = getAssetFolder(p.category, p.subcategory);
    console.log(`[${i + 1}] ${p.title}`);
    console.log(`    Category: ${p.category}${p.subcategory ? ' > ' + p.subcategory : ''}`);
    console.log(`    Folder: assets/${folder}/`);
    console.log(`    Filename: ${p.filename}.png`);
    console.log();
  });
}

export { parsePrompts, getAssetFolder };
