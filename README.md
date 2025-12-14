1.
cd backend
npm install //first time or if new package added

2.
cd frontend
npm install //first time or if new package added

3.
cd D:\your_directory\CityZen\ai-service
venv\Scripts\activate
uvicorn ai_service:app --host 0.0.0.0 --port 8000

change in runAidetection

4.
terminal 1
cd backend
npm run dev

5.
terminal 2
lt --port 3000 --subdomain cityzen-api

6.
terminal 3
cd frontend
npx expo start

//if there is a problem with lucid react
npm install lucide-react

after expo start-
go to expo go mobile app
scan the generated QR code
first time 1-3 mins normal
then boot up and see the app
