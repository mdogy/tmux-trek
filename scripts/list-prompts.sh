#!/bin/bash

# Quick script to list all prompts that need generation

echo "TMUX Trek Asset Generation Prompts"
echo "===================================="
echo ""
echo "This lists all prompts in docs/assets/image-generation-prompts.md"
echo "that need to be generated via Google Gemini."
echo ""

node scripts/parse-prompts.js
