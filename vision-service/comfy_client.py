#!/usr/bin/env python3
"""
ComfyUI Vision Client for Botlands
Connects to ComfyUI on Windows (172.18.208.1:8188) for image analysis via Florence2
"""
import json
import urllib.request
import urllib.parse
import websocket
import uuid
import os
from PIL import Image
import io

COMFY_HOST = os.getenv("COMFY_HOST", "172.18.208.1")
COMFY_PORT = int(os.getenv("COMFY_PORT", "8188"))
COMFY_URL = f"http://{COMFY_HOST}:{COMFY_PORT}"
WS_URL = f"ws://{COMFY_HOST}:{COMFY_PORT}/ws"


def upload_image(image_path, name="input.png"):
    """Upload image to ComfyUI"""
    with open(image_path, "rb") as f:
        data = f.read()
    
    import requests
    files = {"image": (name, data, "image/png")}
    response = requests.post(f"{COMFY_URL}/api/upload/image", files=files)
    return response.json()


def queue_prompt(workflow):
    """Send workflow to ComfyUI queue"""
    import requests
    p = {"prompt": workflow, "client_id": str(uuid.uuid4())}
    response = requests.post(f"{COMFY_URL}/api/prompt", json=p)
    return response.json()


def get_history(prompt_id):
    """Get execution history for prompt"""
    import requests
    response = requests.get(f"{COMFY_URL}/api/history/{prompt_id}")
    return response.json()


def get_image(filename, subfolder, folder_type):
    """Download generated image"""
    import requests
    data = {"filename": filename, "subfolder": subfolder, "type": folder_type}
    url_values = urllib.parse.urlencode(data)
    response = requests.get(f"{COMFY_URL}/api/view?{url_values}")
    return response.content


def create_florence_caption_workflow(image_name, detail="detailed"):
    """Create Florence2 caption workflow"""
    
    # Task type
    task = "<DETAILED_CAPTION>" if detail == "detailed" else "<CAPTION>"
    
    workflow = {
        "1": {
            "inputs": {"image": image_name, "upload": "image"},
            "class_type": "LoadImage"
        },
        "2": {
            "inputs": {
                "text_input": task,
                "max_new_tokens": 1024,
                "num_beams": 3,
                "do_sample": False,
                "output_type": "text",
                "image": ["1", 0]
            },
            "class_type": "Florence2Run"
        },
        "3": {
            "inputs": {"text": ["2", 0]},
            "class_type": "ShowText|pysssss"
        }
    }
    
    return workflow


def analyze_image(image_path, task="caption"):
    """
    Analyze image using ComfyUI + Florence2
    
    Args:
        image_path: Path to image file
        task: 'caption', 'detailed_caption', 'ocr', 'od'
    
    Returns:
        dict with results
    """
    import requests
    
    # Upload image
    upload_result = upload_image(image_path)
    image_name = upload_result.get("name", os.path.basename(image_path))
    
    # Map task to Florence2 prompt
    task_map = {
        "caption": "<CAPTION>",
        "detailed_caption": "<DETAILED_CAPTION>",
        "ocr": "<OCR>",
        "od": "<OD>"
    }
    florence_task = task_map.get(task, "<CAPTION>")
    
    # Create workflow
    workflow = create_florence_caption_workflow(image_name, "detailed" if task == "detailed_caption" else "simple")
    
    # Update task in workflow
    workflow["2"]["inputs"]["text_input"] = florence_task
    
    # Queue workflow
    prompt_result = queue_prompt(workflow)
    prompt_id = prompt_result["prompt_id"]
    
    # Wait for completion via websocket
    ws = websocket.create_connection(WS_URL)
    
    result = None
    while True:
        msg = ws.recv()
        if isinstance(msg, str):
            data = json.loads(msg)
            if data.get("type") == "executing" and data.get("data", {}).get("prompt_id") == prompt_id:
                if data["data"].get("node") is None:
                    # Execution complete
                    break
    
    ws.close()
    
    # Get result from history
    history = get_history(prompt_id)
    if prompt_id in history:
        outputs = history[prompt_id]["outputs"]
        
        # Extract text output
        text_output = ""
        for node_id, node_output in outputs.items():
            if "text" in node_output:
                text_output = node_output["text"][0] if isinstance(node_output["text"], list) else node_output["text"]
                break
        
        return {
            "success": True,
            "task": task,
            "result": text_output,
            "prompt_id": prompt_id
        }
    
    return {"success": False, "error": "No output found"}


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        result = analyze_image(image_path, "detailed_caption")
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print("Usage: python3 comfy_client.py <image_path>")
