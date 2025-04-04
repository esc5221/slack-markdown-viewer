#!/usr/bin/env python3
"""
이미지 리사이징 스크립트

scripts/icon.png 파일을 읽어서 icons 디렉토리에 icon16.png, icon48.png, icon128.png 파일을 생성합니다.
"""

import os
from PIL import Image

def main():
    # 스크립트 위치 기준으로 경로 설정
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base_dir = os.path.dirname(script_dir)
    
    # 소스 및 타겟 경로 설정
    source_path = os.path.join(script_dir, 'icon.png')
    icons_dir = os.path.join(base_dir, 'icons')
    
    # icons 디렉토리가 없으면 생성
    os.makedirs(icons_dir, exist_ok=True)
    
    # 출력 파일 경로 설정
    output_paths = {
        16: os.path.join(icons_dir, 'icon16.png'),
        32: os.path.join(icons_dir, 'icon32.png'),
        48: os.path.join(icons_dir, 'icon48.png'),
        128: os.path.join(icons_dir, 'icon128.png')
    }
    
    # 소스 이미지 확인
    if not os.path.exists(source_path):
        print(f"오류: scripts/icon.png 파일을 찾을 수 없습니다")
        return False
    
    try:
        # 이미지 로드
        img = Image.open(source_path)
        
        # 각 크기별로 리사이즈 및 저장
        for size, output_path in output_paths.items():
            resized_img = img.resize((size, size), Image.Resampling.LANCZOS)
            resized_img.save(output_path)
            print(f"생성됨: {output_path}")
        
        print("모든 아이콘이 생성되었습니다.")
        return True
    
    except Exception as e:
        print(f"오류 발생: {e}")
        return False

if __name__ == "__main__":
    main()
