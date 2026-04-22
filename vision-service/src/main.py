from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from PIL import Image
import io
import torch
from transformers import AutoProcessor, AutoModelForCausalLM
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Botlands Vision Service - Florence2")

# Device configuration
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
logger.info(f"Using device: {DEVICE}")

# Load Florence2 model
MODEL_ID = "microsoft/Florence-2-base"
logger.info(f"Loading model: {MODEL_ID}...")

processor = AutoProcessor.from_pretrained(MODEL_ID, trust_remote_code=True)
model = AutoModelForCausalLM.from_pretrained(MODEL_ID, trust_remote_code=True).to(DEVICE)
model.eval()

logger.info("Model loaded successfully!")

@app.post("/describe")
async def describe_image(file: UploadFile = File(...), detail: str = "detailed"):
    """Generate image caption using Florence2"""
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        # Select prompt based on detail level
        if detail == "detailed":
            prompt = "<DETAILED_CAPTION>"
        else:
            prompt = "<CAPTION>"
        
        inputs = processor(text=prompt, images=image, return_tensors="pt").to(DEVICE)
        
        with torch.no_grad():
            generated_ids = model.generate(
                input_ids=inputs["input_ids"],
                pixel_values=inputs["pixel_values"],
                max_new_tokens=1024,
                num_beams=3,
                do_sample=False
            )
        
        generated_text = processor.batch_decode(generated_ids, skip_special_tokens=False)[0]
        parsed_answer = processor.post_process_generation(generated_text, task=prompt, image_size=(image.width, image.height))
        
        return JSONResponse({
            "success": True,
            "description": parsed_answer.get(prompt, generated_text),
            "model": MODEL_ID,
            "detail_level": detail,
            "image_size": {"width": image.width, "height": image.height}
        })
        
    except Exception as e:
        logger.error(f"Describe error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ocr")
async def extract_text(file: UploadFile = File(...)):
    """Extract text from image using Florence2 OCR"""
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        prompt = "<OCR>"
        inputs = processor(text=prompt, images=image, return_tensors="pt").to(DEVICE)
        
        with torch.no_grad():
            generated_ids = model.generate(
                input_ids=inputs["input_ids"],
                pixel_values=inputs["pixel_values"],
                max_new_tokens=2048,
                num_beams=3,
                do_sample=False
            )
        
        generated_text = processor.batch_decode(generated_ids, skip_special_tokens=False)[0]
        parsed_answer = processor.post_process_generation(generated_text, task=prompt, image_size=(image.width, image.height))
        
        return JSONResponse({
            "success": True,
            "text": parsed_answer.get(prompt, generated_text),
            "model": MODEL_ID,
            "image_size": {"width": image.width, "height": image.height}
        })
        
    except Exception as e:
        logger.error(f"OCR error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/detect")
async def detect_objects(file: UploadFile = File(...)):
    """Detect objects in image using Florence2"""
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        prompt = "<OD>"
        inputs = processor(text=prompt, images=image, return_tensors="pt").to(DEVICE)
        
        with torch.no_grad():
            generated_ids = model.generate(
                input_ids=inputs["input_ids"],
                pixel_values=inputs["pixel_values"],
                max_new_tokens=2048,
                num_beams=3,
                do_sample=False
            )
        
        generated_text = processor.batch_decode(generated_ids, skip_special_tokens=False)[0]
        parsed_answer = processor.post_process_generation(generated_text, task=prompt, image_size=(image.width, image.height))
        
        return JSONResponse({
            "success": True,
            "objects": parsed_answer.get(prompt, {}),
            "model": MODEL_ID,
            "image_size": {"width": image.width, "height": image.height}
        })
        
    except Exception as e:
        logger.error(f"Detect error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model": MODEL_ID,
        "device": str(DEVICE),
        "cuda_available": torch.cuda.is_available()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)