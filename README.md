# PushDeploy

PushDeploy is an open-source, production-grade platform that serves as a Vercel alternative, enabling developers to deploy GitHub-based apps with CI/CD, monitor build status, and manage deployments with secure authentication and real-time feedback.

## Features
- GitHub Login (OAuth via Supabase)
- GitHub repo list
- One-click Deploy Now button
- CI/CD via GitHub Actions
- Build status monitoring
- Preview URLs
- Dashboard UI (React + Tailwind)
- Hosted on Railway (Backend) + Cloudflare Pages (Frontend)
- Supabase for DB + Auth

## Setup

### Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` and fill in your environment variables.
   - Add `GITHUB_TOKEN` with a GitHub personal access token that has `repo` and `workflow` permissions.
- In your GitHub repository settings, add a secret named `BACKEND_WEBHOOK_URL` with the URL of your backend `/webhook` endpoint.
4. Start the backend server:
   ```bash
   npm start
   ```

### Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` and ensure environment variables prefixed with `VITE_` are set.
4. Start the frontend development server:
   ```bash
   npm run dev
   ```

## Environment Variables
Refer to `.env.example` for required environment variables. Note that frontend variables must be prefixed with `VITE_`.

## License

MIT License