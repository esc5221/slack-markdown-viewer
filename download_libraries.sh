#!/bin/bash

# Create directory structure if it doesn't exist
mkdir -p libs

echo "Downloading libraries for Slack Markdown Viewer extension..."

# Download Turndown.js (HTML to Markdown converter)
echo "Downloading Turndown.js..."
curl -L https://unpkg.com/turndown/dist/turndown.js -o libs/turndown.js

# Download Marked.js (Markdown to HTML renderer)
echo "Downloading Marked.js..."
curl -L https://cdn.jsdelivr.net/npm/marked/marked.min.js -o libs/marked.min.js

# Download Lucide.js (Icon library)
echo "Downloading Lucide.js..."
curl -L https://unpkg.com/lucide/dist/umd/lucide.min.js -o libs/lucide.min.js

echo "All libraries downloaded successfully!"
echo "Place your icon files (icon16.png, icon48.png, icon128.png) in the 'icons' directory."
echo "You can now load the extension in Chrome using 'Load unpacked' from chrome://extensions/ page."
