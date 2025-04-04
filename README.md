# Slack Markdown Viewer

A browser extension that adds a button to Slack messages for viewing them in a clean Markdown reader mode.

## Features

-   🔍 Hover over Slack messages to reveal a Markdown viewer button
-   📝 Convert Slack's rich text formatting to clean Markdown
-   🌙 Toggle between light and dark themes in the reader mode
-   🧩 Properly renders code blocks, lists, tables, and other Markdown elements
-   😀 Preserves emoji and special characters
-   ⌨️ Keyboard shortcuts (ESC to close)

## Installation

### From a Release

1. Download the latest `.zip` file from the [Releases](https://github.com/yourusername/slack-markdown-viewer/releases) section
2. Extract the zip file to a folder on your computer
3. In Chrome/Edge/Brave, go to `chrome://extensions/`
4. Enable "Developer mode" (toggle in the top-right corner)
5. Click "Load unpacked" and select the folder you extracted

### From Source

1. Clone this repository:

    ```
    git clone https://github.com/yourusername/slack-markdown-viewer.git
    ```

2. Run the library download script:

    ```
    cd slack-markdown-viewer
    chmod +x download_libraries.sh
    ./download_libraries.sh
    ```

3. In Chrome/Edge, go to `chrome://extensions/`
4. Enable "Developer mode" (toggle in the top-right corner)
5. Click "Load unpacked" and select the cloned repository folder

## Usage

1. Navigate to https://app.slack.com in your browser
2. Hover over any message to see the Markdown viewer button
3. Click the button to view the message in clean Markdown format
4. Use the toggle in the modal to switch between light and dark themes
5. Press ESC or click the X button to close the modal

## Development

### Project Structure

-   `manifest.json` - Extension configuration
-   `content_script.js` - Main script that runs on Slack pages
-   `content_style.css` - Styling for buttons and modal
-   `utils/` - Utility functions for conversion
-   `libs/` - External libraries
-   `icons/` - Extension icons
-   `scripts/` - Utility scripts for development
    -   `resize_icons.py` - Script to resize icons
    -   `create_release.sh` - Script to create distribution package

### External Libraries

This extension uses the following libraries (automatically downloaded by `download_libraries.sh`):

-   [Turndown.js](https://github.com/mixmark-io/turndown) - Converts HTML to Markdown
-   [Marked.js](https://marked.js.org/) - Renders Markdown as HTML
-   [Lucide](https://lucide.dev/) - Icon library

### Creating a Release

To create a distribution zip file (for sharing or uploading to stores):

```bash
# 스크립트 실행 권한 설정
chmod +x scripts/create_release.sh

# 배포 파일 생성 (버전 자동 증가, git 커밋 포함)
./scripts/create_release.sh

# 특정 버전으로 지정
./scripts/create_release.sh --version 1.2.0

# git 커밋 없이 생성
./scripts/create_release.sh --no-commit
```

This will:

1. Increment the version in `manifest.json`
2. Create a zip file with only the necessary files
3. Optionally commit and tag the release in git

이 스크립트는 manifest.json의 버전을 자동으로 증가시키고, 필요한 파일만 zip으로 묶어 배포합니다.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

-   [Slack](https://slack.com/) for their amazing platform
-   The developers of Turndown.js, Marked.js, and Lucide
