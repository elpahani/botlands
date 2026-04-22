#!/usr/bin/env python3
"""
Simple OCR script for Botlands
Usage: python3 ocr_scan.py <image_path>
"""
import sys
from paddleocr import PaddleOCR
from PIL import Image
import json
import numpy as np

# Initialize OCR
print("Loading OCR model...", file=sys.stderr)
ocr = PaddleOCR(lang='ru')

def scan_image(image_path):
    """Scan image and extract text with positions"""
    image = Image.open(image_path)
    img_array = np.array(image)
    
    result = ocr.ocr(img_array)
    
    text_blocks = []
    if result and result[0]:
        for line in result[0]:
            if line:
                bbox = line[0]
                text = line[1][0]
                confidence = line[1][1]
                
                text_blocks.append({
                    "text": text,
                    "confidence": float(confidence),
                    "position": {
                        "x": min(p[0] for p in bbox),
                        "y": min(p[1] for p in bbox),
                        "width": max(p[0] for p in bbox) - min(p[0] for p in bbox),
                        "height": max(p[1] for p in bbox) - min(p[1] for p in bbox)
                    }
                })
    
    return {
        "image_size": {"width": image.size[0], "height": image.size[1]},
        "text_blocks": text_blocks,
        "plain_text": "\n".join([t["text"] for t in text_blocks])
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 ocr_scan.py <image_path>", file=sys.stderr)
        sys.exit(1)
    
    image_path = sys.argv[1]
    result = scan_image(image_path)
    print(json.dumps(result, ensure_ascii=False, indent=2))