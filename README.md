# MomentumOS

AI-powered personal planning dashboard. Generates structured daily schedules from user goals using GPT-4o, persisted in PostgreSQL, with a premium dark glassmorphism UI.

---

## Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Frontend | React + Vite, TailwindCSS, Framer Motion|
| Backend  | Node.js, Express.js                     |
| Database | PostgreSQL (Docker), Prisma ORM         |
| AI       | OpenAI GPT-4o-mini                      |

---

## Architecture

```
Browser (React + Vite :5173)
        ↓ axios
Express API (:3001)
        ↓ Prisma ORM
PostgreSQL (Docker :5432)
        ↓ OpenAI SDK
GPT-4o-mini
```

---

## Startup Sequence

### 1. Clone & set up environment

```bash
cd MomentumOS

# Root env (Docker)
cp .env.example .env

# Backend env
cp backend/.env.example backend/.env
# → Fill in OPENAI_API_KEY in backend/.env
```

### 2. Start the database

```bash
docker compose up -d
# PostgreSQL now running on localhost:5432
# Connect in TablePlus: host=localhost port=5432 user=momentum pass=momentum_secret db=momentumos
```

### 3. Install backend & run migrations

```bash
cd backend
npm install
npx prisma generate       # generates Prisma client
npx prisma db push        # creates tables from schema.prisma
npm run dev               # starts Express on :3001
```

### 4. Install frontend & start dev server

```bash
# In a new terminal
cd frontend
npm install
npm run dev               # starts Vite on :5173
```

### 5. Open the app

Navigate to **http://localhost:5173**

---

## API Routes

| Method | Route                | Description                     |
|--------|---------------------|---------------------------------|
| POST   | /api/plan/generate  | Send goals → AI returns schedule|
| POST   | /api/plan/save      | Persist a plan + tasks to DB    |
| GET    | /api/plan           | Fetch all plans with tasks      |
| PATCH  | /api/task/:id       | Toggle task completed status    |

---

## Database Schema

```
plans
  id             cuid (PK)
  title          text
  goals          text
  available_time integer (hours)
  created_at     timestamp

tasks
  id             cuid (PK)
  plan_id        cuid (FK → plans.id)
  time_block     text  ("09:00-09:45")
  task           text
  completed      boolean (default false)
```

---

## TablePlus Connection

| Field    | Value            |
|----------|------------------|
| Host     | localhost        |
| Port     | 5432             |
| User     | momentum         |
| Password | momentum_secret  |
| Database | momentumos       |

---

## Environment Variables

**backend/.env**
```
PORT=3001
DATABASE_URL="postgresql://momentum:momentum_secret@localhost:5432/momentumos"
OPENAI_API_KEY=sk-...
```

**frontend** — uses Vite's proxy (`/api` → `:3001`), no env file needed in dev.

---

## Project Structure

```
MomentumOS/
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── server.js
│   │   ├── routes/        plan.js  task.js
│   │   ├── controllers/   planController.js  taskController.js
│   │   ├── services/      openaiService.js
│   │   └── middleware/    errorHandler.js
│   └── package.json
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── api/           index.js
        ├── components/    AnimatedBackground  Sidebar  Navbar
        │                  GlassCard  AIGenerationForm
        │                  TimelinePlanner  TaskChecklist  ProgressWidgets
        └── pages/         Landing  Dashboard  CreatePlan
```
