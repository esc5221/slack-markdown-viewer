#!/usr/bin/env python3

import os
import sys
import subprocess
from pathlib import Path

# Get the directory paths
script_dir = Path(__file__).parent
icons_dir = script_dir.parent / 'icons'
svg_path = icons_dir / 'icon.svg'

# Check if the SVG file exists
if not svg_path.exists():
    print(f"\033[91mError: SVG file not found at {svg_path}\033[0m")
    sys.exit(1)

# Check if ImageMagick is installed
try:
    subprocess.run(['convert', '-version'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
except (subprocess.CalledProcessError, FileNotFoundError):
    print("\033[91mError: ImageMagick is not installed.\033[0m")
    print("Please install ImageMagick to use this script:")
    print("  - macOS: brew install imagemagick")
    print("  - Linux: sudo apt-get install imagemagick")
    print("  - Windows: Download from https://imagemagick.org/script/download.php")
    sys.exit(1)

# Sizes to generate
sizes = [16, 48, 128]

print("\033[96mGenerating PNG icons from SVG...\033[0m")

for size in sizes:
    output_path = icons_dir / f"icon{size}.png"
    
    try:
        print(f"Creating {size}x{size} icon...")
        subprocess.run([
            'convert',
            '-background', 'none',
            '-resize', f"{size}x{size}",
            str(svg_path),
            str(output_path)
        ], check=True)
        print(f"\033[92mSuccessfully created {output_path}\033[0m")
    except subprocess.CalledProcessError as e:
        print(f"\033[91mFailed to create {size}x{size} icon: {e}\033[0m")

print("\033[96mIcon generation complete!\033[0m")
