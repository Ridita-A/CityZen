# CityZen

CityZen is a civic issue reporting platform that helps citizens report real-world community problems quickly and routes them to the appropriate authority for action. Using a mobile-first workflow, users can capture photos of issues such as potholes, waste buildup, unsafe electrical conditions, drainage problems, and similar urban hazards, while the platform supports investigation, escalation, moderation, and performance monitoring across the complaint lifecycle.

## 1. Introduction

CityZen is designed to make local problem reporting more accessible, traceable, and accountable. Instead of relying on slow or informal complaint channels, the platform gives citizens a structured way to submit evidence-based complaints with images, location data, and category information. The system then stores the complaint, recommends or routes it to the responsible authority, and supports follow-up actions until the issue is resolved, appealed, or formally moderated.

The project combines a React Native and Expo frontend, a Node.js and Express backend, PostgreSQL via Sequelize, a FastAPI-based AI service for image analysis, and a second FastAPI service for OpenRouter-powered recommendation and text assistance.

## 2. Motivation

Urban problems are often easy to observe but difficult to report effectively. Citizens may not know which authority is responsible, may not have a reliable way to submit evidence, and often receive little visibility into what happens after a complaint is filed. That lack of transparency weakens public trust and slows down response times.

CityZen addresses that gap by creating a single digital workflow for complaint submission, authority handling, and administrative oversight. The platform is intended to reduce friction for citizens, improve operational visibility for responsible agencies, and create a stronger accountability layer through analytics, moderation, appeals, and documented status updates.

## 3. Core Features

- Photo-based complaint submission with title, description, GPS location, and category selection.
- AI-assisted issue detection and evidence verification for complaint and follow-up images.
- Duplicate complaint detection with the ability to view an existing case or bump it instead of re-submitting.
- Authority recommendation based on category and location.
- Complaint tracking across statuses such as pending, accepted, in progress, resolved, rejected, and appealed.
- Community participation through upvotes, reporting, and additional evidence submission.
- Appeal handling for rejected complaints.
- Role-based workflows for citizens, authorities, and administrators.
- Moderation system with strikes, permanent bans, and banned-user review.
- Administrative dashboards for KPIs, complaint trends, category statistics, and department performance.
- PDF export support for selected analytics and misconduct reporting workflows.
- OTP-based authentication support for signup and login.

## 4. As Citizen

As a citizen, CityZen allows a user to:

- Capture and submit complaints with one or more photos.
- Attach location data so the issue can be mapped to the relevant service area.
- Receive AI-assisted category detection and structured complaint submission support.
- See potentially similar complaints before creating a duplicate report.
- Bump an existing complaint to raise urgency when the same issue remains unresolved.
- Upvote and report community complaints.
- Add follow-up evidence after a complaint has already been submitted.
- Track personal complaints and review status changes from one screen.
- Appeal rejected complaints and provide additional context.
- Receive notifications about status updates and moderation-related events.
- Review personal moderation status, including strikes and ban state.

## 5. As Authority

As an authority user, CityZen supports operational handling of assigned complaints by enabling the authority to:

- View complaints assigned to the relevant department or authority company.
- Monitor queue status across pending, accepted, active, resolved, and appealed cases.
- Open complaint details with citizen evidence, location, community activity, and appeal remarks.
- Accept, start, update, and resolve complaints through the backend workflow.
- Upload progress or resolution evidence as part of official case handling.
- Identify escalated complaints with strong community interest.
- See admin-forwarded appeal cases marked for re-investigation.
- Review department-level workload and performance data.
- Generate authority-facing analytics and reports.

## 6. As Admin

As an admin, CityZen provides platform-wide oversight and governance capabilities, including the ability to:

- Review complaint volume, status distribution, and operational KPIs.
- Monitor department performance and service health.
- Review reported posts and citizen appeals from a moderation workflow.
- Approve or reject appealed complaints and forward approved cases back to authorities.
- Manage moderation actions, including delete-and-strike decisions.
- Issue strikes to policy violators and permanently ban repeat offenders.
- Review banned users and user moderation history.
- Manage complaint categories and department mappings.
- Review category requests created from AI-detected unknown issue types.
- Export analytics in PDF format for administrative review and reporting.

## 7. Local Development Setup Guide (Precise and Short)

### Prerequisites

- Node.js and npm
- Python 3.10+
- PostgreSQL
- Expo Go or a simulator/emulator for mobile testing

### Required environment files

Create or update these files before starting the project:

`frontend/.env`

- `EXPO_PUBLIC_API_URL=http://<YOUR_LOCAL_IP>:3000`
- `EXPO_PUBLIC_OPENROUTER_API_URL=http://<YOUR_LOCAL_IP>:8001`
- `EXPO_PUBLIC_AI_SERVICE_URL=http://<YOUR_LOCAL_IP>:8000`
- Firebase client keys used by the frontend

`backend/.env`

- `PORT=3000`
- `DATABASE_URL` or the `DB_*` variables
- `JWT_SECRET`
- Firebase admin credentials
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- Optional for email OTP: `EMAIL_USER`, `EMAIL_PASS`

`openrouter-service/.env`

- `OPENROUTER_API_KEY`

Use your machine's local IP in `frontend/.env` if the app will be opened on a physical phone.

### Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
cd ../ai-service && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt
cd ../openrouter-service && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt
```

### Run the system

On Linux:

```bash
./run-cityzen.sh
```

On Windows PowerShell:

```powershell
.\run-cityzen.ps1
```

If you prefer to run services manually, use four terminals:

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npx expo start

# Terminal 3
cd ai-service && source venv/bin/activate && uvicorn ai_service:app --host 0.0.0.0 --port 8000

# Terminal 4
cd openrouter-service && source venv/bin/activate && uvicorn openrouter_service:app --host 0.0.0.0 --port 8001
```

## 8. Conclusion

CityZen is positioned as a practical civic technology platform that connects citizens, authorities, and administrators in one complaint management workflow. Its value lies not only in making issue reporting easier, but also in improving transparency, routing accuracy, moderation control, and operational accountability. With image-based reporting, AI-assisted support, appeals, analytics, and role-specific dashboards, the project provides a strong foundation for a modern community issue management system.

### Better City, Better Life