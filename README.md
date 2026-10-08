# Smart Study AI

An intelligent study roadmap and quiz generation platform powered by local Llama 3.2 via Ollama.

## Features

- **Authentication System:** Secure registration and login for students.
- **Admin Dashboard:** Special access dashboard for Admins (`role="ADMIN"`) to manage users.
- **AI Roadmap Generation:** Input your subject, syllabus, exam date, and daily study time. Llama 3.2 creates a complete topic-by-topic breakdown with theory and video search links.
- **Progress Tracking & Topic Unlocking:** Topics are unlocked sequentially. You must pass a 5-question AI-generated quiz with an 80% score to unlock the next topic.
- **Quiz Explanations:** Get detailed AI-generated explanations for quiz answers.
- **Dark/Light Mode:** Toggle themes with a beautiful Glassmorphism UI.

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **UI:** React, Custom Glassmorphism CSS, next-themes
- **Database:** SQLite with Prisma ORM
- **Authentication:** NextAuth.js (Credentials Provider + bcryptjs)
- **AI Engine:** Local Ollama (running `llama3.2`)

## Prerequisites

1. Node.js v18+
2. [Ollama](https://ollama.ai) installed locally.
3. Pull the required model: `ollama run llama3.2`

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Setup the Database:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

3. Setup environment variables (`.env`):
   ```env
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_SECRET="your_secret_key_here"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. Seed an Admin User (Optional):
   ```bash
   node scripts/seedAdmin.cjs
   ```
   Admin credentials will be: `admin@example.com` / `admin123`

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing the Flow
1. Create a student account and log in.
2. Go to the Dashboard and click "Generate New Roadmap".
3. Enter your subject, syllabus, and timeframe. Wait ~30 seconds for the AI to generate your custom syllabus.
4. View your Roadmap and click "Take Quiz" on the first unlocked topic.
5. Answer the AI-generated questions to score >= 80% and unlock the next module!
