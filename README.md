# Cityzen – Local Development Setup

This document contains **everything needed** to run **Cityzen locally**, including the **quick-start script**, **full manual setup**, and **environment configuration**.

---

## Final Run Script (Quick Start)

### Terminal 1

```powershell
.\run-cityzen.ps1
```

If the script is not available or fails, follow the **manual setup** below.

---

## Manual Setup

You will need **5 terminals running simultaneously**.

---

### Terminal 1 – Backend Server

Navigate to the backend folder:

```powershell
cd backend
```

Install dependencies (first time or when a new package is added):

```powershell
npm install
```

Start the backend development server:

```powershell
npm run dev
```

---

### Terminal 2 – Expose Backend API (LocalTunnel)

Expose the backend API running on port **3000**:

```powershell
lt --port 3000 --subdomain cityzen-api
```

**Notes:**

* Keep this terminal running while the app is in use
* A tunnel URL will be generated
* Open the link once and **enter the tunnel password** if prompted

Copy the generated URL and paste it into:

```
frontend\.env  →  EXPO_PUBLIC_API_URL
```

---

### Terminal 3 – Frontend (Expo)

Navigate to the frontend folder:

```powershell
cd frontend
```

Install dependencies (first time or when a new package is added):

```powershell
npm install
```

Start the Expo frontend:

```powershell
npx expo start
```

If you encounter a `lucide-react` error:

```powershell
npm install lucide-react
```

After Expo starts:

1. Open **Expo Go** on your phone
2. Scan the QR code shown in the terminal
3. First launch may take **1–3 minutes** (normal)
4. The **Cityzen app** will appear after booting

---

### Terminal 4 – AI Detection Service (FastAPI)

Navigate to the AI service folder:

```powershell
cd ai-service
```

Create a Python virtual environment (only once):

```powershell
python -m venv venv
```

Verify the virtual environment:

```powershell
ls venv\Scripts
```

Activate the virtual environment:

```powershell
.\venv\Scripts\Activate.ps1
```

Install required Python packages:

```powershell
pip install fastapi uvicorn
pip install ultralytics
# other packages may be required later
```

Run the AI service (first time):

```powershell
uvicorn ai_service:app --host 0.0.0.0 --port 8000
```

For subsequent runs:

```powershell
cd ai-service
venv\Scripts\Activate.ps1
uvicorn ai_service:app --host 0.0.0.0 --port 8000
```

---

### Terminal 5 – AI Recommendation Service (OpenRouter / FastAPI)

Navigate to the OpenRouter service folder:

```powershell
cd openrouter-service
```

Create a Python virtual environment (only once):

```powershell
python -m venv venv
```

Verify the virtual environment:

```powershell
ls venv\Scripts
```

Activate the virtual environment:

```powershell
.\venv\Scripts\Activate.ps1
```

Install required Python packages:

```powershell
pip install fastapi uvicorn
pip install ultralytics
pip install python-dotenv
pip install openrouter
pip install openai
# other packages may be required later
```

Run the AI recommendation service (first time):

```powershell
uvicorn openrouter_service:app --host 0.0.0.0 --port 8001
```

For subsequent runs:

```powershell
cd openrouter-service
venv\Scripts\Activate.ps1
uvicorn openrouter_service:app --host 0.0.0.0 --port 8001
```

---

## IP Address Configuration (Important)

You must add **your local IP address** to the following files:

```
frontend\src\services\api.js
  → API_BASE_URL

frontend\src\screens\SubmitComplaintScreen.js
  → runAiDetection

frontend\.env
  → EXPO_PUBLIC_OPENROUTER_API_URL
```

### How to get your IP address

Run the following command:

```powershell
ipconfig
```

Copy the **IPv4 Address** under:

```
Wireless LAN adapter Wi-Fi
```

Use this IP where required in the files above.

---

## Environment Files

The following folders contain `.env` files that must be configured correctly:

* `frontend/.env`
* `backend/.env`
* `gemini-service/.env`

Ensure all required URLs, keys, and ports are set before running the app.

---

## Notes

* Always activate the **Python virtual environment** before running any AI service
* Run `npm install` again if dependencies change
* Expo first boot delay is normal
* **All five terminals must remain running** while using the app

---

## Terminal Overview

| Terminal   | Purpose                             |
| ---------- | ----------------------------------- |
| Terminal 1 | Backend server                      |
| Terminal 2 | LocalTunnel API exposure            |
| Terminal 3 | Frontend (Expo)                     |
| Terminal 4 | AI detection service (FastAPI)      |
| Terminal 5 | AI recommendation service (FastAPI) |
