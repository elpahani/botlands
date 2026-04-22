from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from paddleocr import PaddleOCR
from PIL import Image
import io
import base64
import json
import numpy as np
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Botlands OCR Service")

# Initialize PaddleOCR
# lang='ru' for Russian, 'en' for English, or 'ru_en' for both
ocr = PaddleOCR(
    lang='ru'
)

@app.post("/scan")
async def scan_document(file: UploadFile = File(...)):
    """
    Scan document image and extract:
    - Text with positions
    - Tables structure
    - Layout (headers, paragraphs, lists)
    - Images
    """
    try:
        # Read image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Convert to numpy array for PaddleOCR
        img_array = np.array(image)
        
        # OCR
        result = ocr.ocr(img_array)
        
        # Parse results
        text_blocks = []
        tables = []
        
        if result and result[0]:
            for line in result[0]:
                if line:
                    bbox = line[0]  # Bounding box
                    text = line[1][0]  # Text content
                    confidence = line[1][1]  # Confidence score
                    
                    text_blocks.append({
                        "text": text,
                        "confidence": float(confidence),
                        "bbox": bbox,
                        "position": {
                            "x": min(p[0] for p in bbox),
                            "y": min(p[1] for p in bbox),
                            "width": max(p[0] for p in bbox) - min(p[0] for p in bbox),
                            "height": max(p[1] for p in bbox) - min(p[1] for p in bbox)
                        }
                    })
        
        # Detect tables (simple heuristic: multiple aligned text blocks)
        tables = detect_tables(text_blocks)
        
        # Detect layout (headers, paragraphs, lists)
        layout = detect_layout(text_blocks, image.size)
        
        # Extract images (if any embedded)
        images = extract_images(image)
        
        # Generate HTML copy
        html = generate_html(text_blocks, tables, layout, images)
        
        return JSONResponse({
            "success": True,
            "text_blocks": text_blocks,
            "tables": tables,
            "layout": layout,
            "images": images,
            "html": html,
            "plain_text": "\n".join([t["text"] for t in text_blocks]),
            "image_size": {"width": image.size[0], "height": image.size[1]}
        })
        
    except Exception as e:
        logger.error(f"Scan error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/extract-text")
async def extract_text(file: UploadFile = File(...)):
    """Simple text extraction"""
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        img_array = np.array(image)
        
        result = ocr.ocr(img_array)
        
        texts = []
        if result and result[0]:
            for line in result[0]:
                if line:
                    texts.append(line[1][0])
        
        return {
            "success": True,
            "text": "\n".join(texts),
            "lines": texts
        }
        
    except Exception as e:
        logger.error(f"Extract error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/describe")
async def describe_image(file: UploadFile = File(...)):
    """
    Describe image using vision model (placeholder for now)
    Will integrate with Ollama vision models
    """
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # For now, return basic info
        # TODO: Integrate with Ollama vision model
        return {
            "success": True,
            "description": "Image analysis requires vision model integration",
            "size": {"width": image.size[0], "height": image.size[1]},
            "format": image.format
        }
        
    except Exception as e:
        logger.error(f"Describe error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def detect_tables(text_blocks):
    """Detect table structures from text blocks"""
    if len(text_blocks) < 4:
        return []
    
    # Simple table detection: look for aligned columns
    # Group by Y position (rows)
    rows = {}
    for block in text_blocks:
        y = round(block["position"]["y"] / 20) * 20  # Round to nearest 20px
        if y not in rows:
            rows[y] = []
        rows[y].append(block)
    
    tables = []
    for y, row_blocks in rows.items():
        if len(row_blocks) >= 3:  # At least 3 columns
            # Sort by X position
            row_blocks.sort(key=lambda x: x["position"]["x"])
            
            # Check if X positions are aligned across multiple rows
            tables.append({
                "row": y,
                "columns": len(row_blocks),
                "cells": [{"text": b["text"], "bbox": b["bbox"]} for b in row_blocks]
            })
    
    return tables

def detect_layout(text_blocks, image_size):
    """Detect document layout elements"""
    width, height = image_size
    
    layout = {
        "headers": [],
        "paragraphs": [],
        "lists": [],
        "columns": detect_columns(text_blocks, width)
    }
    
    for block in text_blocks:
        text = block["text"]
        font_size = estimate_font_size(block)
        
        # Heuristic: large font = header
        if font_size > 20 or len(text) < 50 and text.isupper():
            layout["headers"].append(block)
        # Heuristic: bullet points or numbers = list
        elif text.strip().startswith(("•", "-", "*", "1.", "2.", "3.")):
            layout["lists"].append(block)
        else:
            layout["paragraphs"].append(block)
    
    return layout

def detect_columns(text_blocks, image_width):
    """Detect multi-column layout"""
    if not text_blocks:
        return []
    
    # Group by X position
    x_positions = [b["position"]["x"] for b in text_blocks]
    if not x_positions:
        return []
    
    # Simple: split into left/right if wide gap
    mid = image_width / 2
    left = [b for b in text_blocks if b["position"]["x"] < mid]
    right = [b for b in text_blocks if b["position"]["x"] >= mid]
    
    if len(left) > 3 and len(right) > 3:
        return [
            {"side": "left", "blocks": left},
            {"side": "right", "blocks": right}
        ]
    
    return []

def estimate_font_size(block):
    """Estimate font size from bounding box height"""
    return block["position"]["height"]

def extract_images(image):
    """Extract embedded images (placeholder)"""
    # TODO: Implement image extraction
    return []

def generate_html(text_blocks, tables, layout, images):
    """Generate HTML representation of document"""
    html_parts = ['<div class="scanned-document">']
    
    # Add headers
    for header in layout.get("headers", []):
        html_parts.append(f'<h2 style="position:absolute;left:{header["position"]["x"]}px;top:{header["position"]["y"]}px">{header["text"]}</h2>')
    
    # Add paragraphs
    for para in layout.get("paragraphs", []):
        html_parts.append(f'<p style="position:absolute;left:{para["position"]["x"]}px;top:{para["position"]["y"]}px">{para["text"]}</p>')
    
    # Add tables
    for table in tables:
        html_parts.append('<table border="1">')
        html_parts.append('<tr>')
        for cell in table["cells"]:
            html_parts.append(f'<td>{cell["text"]}</td>')
        html_parts.append('</tr>')
        html_parts.append('</table>')
    
    html_parts.append('</div>')
    
    return '\n'.join(html_parts)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)