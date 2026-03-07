import os
import uvicorn
import json
import base64
from typing import Optional
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables from .env file
load_dotenv()

# Configure the OpenRouter API
api_key = os.getenv("OPENROUTER_API_KEY")
if not api_key:
    raise RuntimeError("OPENROUTER_API_KEY not found in .env file")

client = OpenAI(
    api_key=api_key,
    base_url="https://openrouter.ai/api/v1"
)

app = FastAPI()

# -------------------- Utilities --------------------

def extract_json_from_response(text: str):
    """Extract JSON object or array from LLM output."""
    try:
        # Prefer object
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and start < end:
            return json.loads(text[start:end + 1])

        # Fallback to array
        start = text.find("[")
        end = text.rfind("]")
        if start != -1 and end != -1 and start < end:
            return json.loads(text[start:end + 1])

        return None
    except json.JSONDecodeError:
        return None

# -------------------- Models --------------------

class Prompt(BaseModel):
    prompt: str

class Authority(BaseModel):
    id: int
    name: str

class RecommendationRequest(BaseModel):
    category: str
    latitude: float
    longitude: float
    authorities: list[Authority]
    location_string: Optional[str] = None

class GenerateComplaintTextRequest(BaseModel):
    category: str
    confidence: float
    latitude: float
    longitude: float
    location_string: Optional[str] = None

# -------------------- Vision Detection (LLM) --------------------

@app.post("/detect_with_llm")
async def detect_with_llm(
    image: UploadFile = File(...),
    categories: str = Form(...) # Add categories as a Form parameter
):
    try:
        # ---- Validation ----
        if not image.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")

        image_bytes = await image.read()
        if len(image_bytes) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Image too large (max 5MB)")

        image_base64 = base64.b64encode(image_bytes).decode("utf-8")

        # Parse categories and build case-insensitive mappings
        category_list = json.loads(categories)
        allowed_category_names = [cat['name'] for cat in category_list]
        category_name_to_id = {cat['name'].lower(): cat['id'] for cat in category_list}
        category_name_original = {cat['name'].lower(): cat['name'] for cat in category_list}

        prompt = f"""
You are a civic issue detection AI for Dhaka city.

Analyze the image and identify the SINGLE most relevant urban/civic issue.

Existing categories in the system:
{chr(10).join([f'- {name}' for name in allowed_category_names])}

Rules:
- Return ONLY valid JSON
- If the image clearly shows an issue matching one of the existing categories, use that name and set is_new_category to false
- If the image shows a real civic issue that does NOT match any existing category, suggest a short descriptive name (2-4 words, Title Case), provide a brief description (about 10 words) about it and its hazards, and set is_new_category to true
- If no real civic issue is visible, return label "No Issue" and set is_new_category to false
- Confidence must be a number between 0 and 100
- If is_new_category is false, category_description can be null or empty string

Output JSON schema:
{{
  "label": "string",
  "confidence": number,
  "is_new_category": boolean,
  "category_description": "string"
}}
"""
        response = client.chat.completions.create(
            model="openai/gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}"
                            }
                        }
                    ]
                }
            ]
        )

        content = response.choices[0].message.content
        parsed = extract_json_from_response(content)

        if not parsed or "label" not in parsed:
            raise ValueError("Invalid JSON from vision model")

        # ---- Normalize confidence ----
        confidence = parsed.get("confidence", 0)
        try:
            confidence = int(float(confidence))
        except Exception:
            confidence = 0

        confidence = max(0, min(100, confidence))

        detected_label = parsed["label"]
        is_new_category = bool(parsed.get("is_new_category", False))
        category_description = parsed.get("category_description", "")

        # Normalize case for lookup
        detected_label_lower = detected_label.lower()
        
        # Get the DB category ID (only meaningful for known categories)
        category_id = category_name_to_id.get(detected_label_lower) if not is_new_category else None

        # Safety net: if label returned but not in DB and not flagged as new, flag it now
        if detected_label.lower() != "no issue" and not is_new_category and category_id is None:
            # Check if it matches existing by ignoring case just in case the AI messed up is_new_category flag
            if detected_label_lower in category_name_to_id:
                category_id = category_name_to_id[detected_label_lower]
                is_new_category = False
            else:
                is_new_category = True
                
        # If it matched an existing category, normalize the label to the exact DB spelling
        if category_id is not None and detected_label_lower in category_name_original:
            detected_label = category_name_original[detected_label_lower]

        return {
            "id": category_id,
            "label": detected_label,
            "confidence": confidence,
            "is_new_category": is_new_category,
            "category_description": category_description
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------------------- Text Generation --------------------

@app.post("/generate")
async def generate_text(request: Prompt):
    """
    Receives a prompt and returns text generated by the OpenRouter model.
    """
    try:
        response = client.chat.completions.create(
            model="meta-llama/llama-3-8b-instruct",
            messages=[{"role": "user", "content": request.prompt}]
        )
        return {"text": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# -------------------- Complaint Text --------------------

@app.post("/generate_complaint_text")
async def generate_complaint_text(request: GenerateComplaintTextRequest):
    """
    Generates an appropriate title and description for a complaint
    based on the detected category and location using OpenRouter.
    """
    location_info = f"({request.latitude}, {request.longitude})"
    if request.location_string:
        location_info = f"{request.location_string} ({request.latitude}, {request.longitude})"

    prompt = (
        f"You are an AI assistant specialized in generating civic complaint details for Dhaka city.\n\n"
        f"Generate a concise title (max 10 words) and brief description (max 25 words) for a complaint based on following details:\n\n"
        f"Detected Category: {request.category}\n"
        f"AI Confidence: {request.confidence}%\n"
        f"Location: {location_info}\n\n"
        f"Rules:\n"
        f"- Title should be engaging & informative for general public. Add general location info - NO coordinates.\n"
        f"- Description should be simple and summarize the issue, its severity & hazards.\n"
        f"- If detected category is ambiguous, give a generic description.\n"
        f"- Return ONLY valid JSON.\n\n"
        f"Output format:\n"
        f"{{\n"
        f"  \"title\": \"string\",\n"
        f"  \"description\": \"string\"\n"
        f"}}"
    )
    try:
        print("-----GENERATE COMPLAINT TEXT PROMPT-----")
        print(prompt)
        response = client.chat.completions.create(
            model="openai/gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}]
        )
        print("-----GENERATE COMPLAINT TEXT RESPONSE-----")
        print(response.choices[0].message.content)
        
        # Extract JSON from the response
        parsed_json = extract_json_from_response(response.choices[0].message.content)
        
        if parsed_json:
            return parsed_json
        else:
            raise ValueError("No valid JSON found in the model's response.")
            
    except Exception as e:
        print("-----GENERATE COMPLAINT TEXT ERROR-----")
        print(str(e))
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
