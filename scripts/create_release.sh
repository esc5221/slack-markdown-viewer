#!/bin/bash
# Script to create a release zip for Slack Markdown Viewer extension

set -e # Exit on any error

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MANIFEST_FILE="$PROJECT_ROOT/manifest.json"

# Parse arguments
VERSION=""
OUTPUT_DIR="$PROJECT_ROOT"
DO_COMMIT=true

# Help message
function show_help {
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  -v, --version VERSION    Specify version number (default: auto-increment)"
  echo "  -o, --output DIR         Specify output directory (default: project root)"
  echo "  --no-commit              Don't commit to git"
  echo "  -h, --help               Show this help message"
  exit 0
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
  -v | --version)
    VERSION="$2"
    shift 2
    ;;
  -o | --output)
    OUTPUT_DIR="$2"
    shift 2
    ;;
  --no-commit)
    DO_COMMIT=false
    shift
    ;;
  -h | --help)
    show_help
    ;;
  *)
    echo "Unknown option: $1"
    show_help
    ;;
  esac
done

# Check requirements
command -v jq >/dev/null 2>&1 || {
  echo "Error: jq is required. Install with 'brew install jq' or 'apt install jq'"
  exit 1
}
command -v zip >/dev/null 2>&1 || {
  echo "Error: zip is required. Install with 'brew install zip' or 'apt install zip'"
  exit 1
}

# Generate icon PNGs if needed
ICON_16="$PROJECT_ROOT/icons/icon16.png"
ICON_48="$PROJECT_ROOT/icons/icon48.png"
ICON_128="$PROJECT_ROOT/icons/icon128.png"

if [ ! -f "$ICON_16" ] || [ ! -f "$ICON_48" ] || [ ! -f "$ICON_128" ]; then
  echo "Generating PNG icons from SVG..."
  python3 "$SCRIPT_DIR/generate_pngs.py" || {
    echo "Error generating icons. Please check script or generate manually."
    exit 1
  }
fi

# Update version in manifest.json
CURRENT_VERSION=$(jq -r '.version' "$MANIFEST_FILE")
if [ -z "$VERSION" ]; then
  # Auto-increment the patch version (x.y.z -> x.y.z+1)
  IFS='.' read -ra VERSION_PARTS <<<"$CURRENT_VERSION"
  LAST_INDEX=$((${#VERSION_PARTS[@]} - 1))
  VERSION_PARTS[$LAST_INDEX]=$((VERSION_PARTS[$LAST_INDEX] + 1))
  VERSION=$(
    IFS='.'
    echo "${VERSION_PARTS[*]}"
  )
fi

echo "Updating version from $CURRENT_VERSION to $VERSION"
TMP_FILE=$(mktemp)
jq --arg version "$VERSION" '.version = $version' "$MANIFEST_FILE" >"$TMP_FILE"
mv "$TMP_FILE" "$MANIFEST_FILE"

# Create output directory if needed
mkdir -p "$OUTPUT_DIR"

# Define zip filename with version
ZIP_FILE="$OUTPUT_DIR/slack-markdown-viewer-v$VERSION.zip"

# List of files to include in the zip
FILES_TO_INCLUDE=(
  "manifest.json"
  "content_script.js"
  "content_style.css"
  "utils/emoji_map.js"
  "utils/html_to_markdown.js"
  "icons/icon16.png"
  "icons/icon48.png"
  "icons/icon128.png"
  "libs/turndown.js"
  "libs/marked.min.js"
  "libs/lucide.min.js"
)

# Create the zip file
echo "Creating zip file: $ZIP_FILE"
rm -f "$ZIP_FILE"

cd "$PROJECT_ROOT"
for file in "${FILES_TO_INCLUDE[@]}"; do
  if [ -f "$file" ]; then
    zip -q -u "$ZIP_FILE" "$file"
    echo "Added: $file"
  else
    echo "Warning: $file not found, skipping..."
  fi
done

# Create a timestamped copy for backup
TIMESTAMP=$(date +"%Y%m%d")
ARCHIVE_FILE="$OUTPUT_DIR/slack-markdown-viewer-v$VERSION-$TIMESTAMP.zip"
cp "$ZIP_FILE" "$ARCHIVE_FILE"
echo "Created backup copy: $ARCHIVE_FILE"

# Add to git and commit if requested
if [ "$DO_COMMIT" = true ]; then
  if [ -d "$PROJECT_ROOT/.git" ]; then
    echo "Committing to git repository..."
    cd "$PROJECT_ROOT"
    git add "$MANIFEST_FILE"
    git commit -m "Release version $VERSION"
    git tag "v$VERSION"
    echo "Committed and tagged release as v$VERSION"
    echo "Don't forget to push: git push && git push --tags"
  else
    echo "Not a git repository. Skipping commit."
  fi
fi

echo "✓ Release v$VERSION created successfully!"