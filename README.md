# Slack Markdown Viewer Extension

A Chrome extension that adds a "View as Markdown" button to Slack messages, allowing you to view messages in a clean reader mode with proper markdown rendering.

## Project Structure

```
slack-markdown-viewer/
├── manifest.json           # Extension configuration
├── background.js           # Background service worker
├── content_script.js       # Adds buttons to Slack messages
├── content_style.css       # Styles for the buttons
├── modal.html              # Reader mode modal HTML
├── modal.js                # Reader mode functionality
├── modal.css               # Reader mode styling
├── download_libraries.sh   # Bash script to download required libraries
├── download_libraries.py   # Python script to download required libraries
├── download_libraries.js   # Node.js script to download required libraries
├── download_libraries.bat  # Windows batch script to download required libraries
├── scripts/                # Utility scripts
│   ├── generate_icons.sh   # Shell script to generate icons from SVG
│   ├── generate_icons.py   # Python script to generate icons from SVG
│   ├── generate_icons.js   # Node.js script to generate icons from SVG
│   └── generate_icons.bat  # Windows batch script to generate icons from SVG
├── icons/                  # Extension icons
│   ├── icon.svg            # Source SVG icon
│   ├── icon16.png          # 16x16 icon for extension
│   ├── icon48.png          # 48x48 icon for extension
│   └── icon128.png         # 128x128 icon for extension
├── libs/                   # External libraries
│   ├── turndown.js         # HTML to Markdown conversion
│   ├── marked.min.js       # Markdown to HTML rendering
│   └── lucide.min.js       # Icons for the modal
└── utils/                  # Utility functions
    ├── emoji_map.js        # Slack emoji to Unicode conversion
    └── html_to_markdown.js # Custom conversion logic
```

## Setup Instructions

1. **Download Required Libraries**

   You have several options to download the required libraries:

   **Option 1:** Run one of the provided download scripts:
   - For macOS/Linux: `chmod +x download_libraries.sh && ./download_libraries.sh`
   - For Python users: `python download_libraries.py`
   - For Node.js users: `node download_libraries.js`
   - For Windows: Double-click `download_libraries.bat`

   **Option 2:** Manually download the libraries:
   - [Turndown.js](https://unpkg.com/turndown/dist/turndown.js) - For HTML to Markdown conversion
   - [Marked.js](https://cdn.jsdelivr.net/npm/marked/marked.min.js) - For Markdown to HTML rendering in the modal
   - [Lucide.js](https://unpkg.com/lucide/dist/umd/lucide.min.js) - For icons in the modal
   
   Place these files in the `libs/` folder.

2. **Generate Icons**

   The repository includes a base SVG icon in `icons/icon.svg`. You can generate the required PNG icons in different sizes using one of the provided scripts:

   - For macOS/Linux: `chmod +x scripts/generate_icons.sh && ./scripts/generate_icons.sh`
   - For Python users: `python scripts/generate_icons.py`
   - For Node.js users: `node scripts/generate_icons.js`
   - For Windows: Double-click `scripts/generate_icons.bat`

   **Note:** These scripts require ImageMagick to be installed on your system. If you don't have ImageMagick, you can install it:
   - macOS: `brew install imagemagick`
   - Linux: `sudo apt-get install imagemagick`
   - Windows: Download from [ImageMagick's website](https://imagemagick.org/script/download.php)

   Alternatively, you can manually create 16x16, 48x48, and 128x128 PNG icons using any image editor and place them in the `icons/` folder.

3. **Load the Extension in Chrome**

   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in the top-right corner)
   - Click "Load unpacked" and select the `slack-markdown-viewer` folder
   - The extension should now be installed and active

4. **Test the Extension**

   - Navigate to Slack in your browser (https://app.slack.com/)
   - Hover over any message to see the "View as Markdown" button
   - Click the button to open the message in the reader mode

## Implementation Details

### Key Components

1. **Content Script (`content_script.js`)**
   - Injects "View as Markdown" buttons into Slack's interface
   - Uses MutationObserver to detect new messages
   - Extracts message HTML when the button is clicked

2. **HTML to Markdown Conversion (`utils/html_to_markdown.js`)**
   - Uses Turndown to convert Slack's HTML to Markdown
   - Implements custom rules for Slack-specific elements (emoji, code blocks, etc.)

3. **Background Script (`background.js`)**
   - Handles messages from the content script
   - Opens the modal window and passes the markdown content

4. **Reader Mode Modal (`modal.html`, `modal.js`, `modal.css`)**
   - Renders the Markdown as clean HTML
   - Provides theming options (light/dark mode)
   - Formatted for optimal readability

### Notes on Browser Support

This extension is built for Chrome using Manifest V3. It should work with other Chromium-based browsers (Edge, Brave, etc.), but may require modifications for Firefox or Safari.

## Customization

You can customize the appearance of the reader mode by modifying `modal.css`. The extension uses Tailwind CSS via CDN for styling the modal, which can be customized or replaced with your preferred CSS framework.

You can also modify the source SVG icon in `icons/icon.svg` and regenerate the PNG icons using the provided scripts.

## Troubleshooting

If the extension doesn't work as expected:

1. Check the browser console for error messages
2. Verify that all libraries are correctly loaded
3. Slack's HTML structure may change over time, requiring updates to the selectors in `content_script.js`

## License

This project is licensed under the MIT License - see the LICENSE file for details.
