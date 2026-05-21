# 🧠 Smart Learning Planner

A full-stack study scheduling app built with React, Node.js, Express, and MongoDB.

---

##  Project Structure

```
smart-learning-planner/
├── backend/                  # Node.js + Express API
│   ├── models/
│   │   ├── User.js           # User schema with preferences & streak
│   │   ├── Task.js           # Task schema with smart priority scoring
│   │   └── Subject.js        # Subject schema with progress tracking
│   ├── routes/
│   │   ├── auth.js           # Register, login, preferences
│   │   ├── tasks.js          # Full CRUD + progress updates
│   │   ├── subjects.js       # Subject management
│   │   ├── planner.js        # Weekly plan, today's schedule, calendar
│   │   └── dashboard.js      # Stats, charts data
│   ├── middleware/
│   │   └── auth.js           # JWT protection middleware
│   ├── utils/
│   │   ├── smartPlanner.js   #  Core smart scheduling logic
│   │   └── reminderService.js# Daily email reminders (cron)
│   └── server.js             # Express app entry point
│
└── frontend/                 # React + Tailwind CSS
    └── src/
        ├── context/
        │   ├── AuthContext.jsx  # Auth state, login/logout/register
        │   └── ThemeContext.jsx # Dark mode toggle
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── DashboardPage.jsx  # Stats, charts, quick links
        │   ├── TasksPage.jsx      # Task list, filters, CRUD modal
        │   ├── SubjectsPage.jsx   # Subject cards with progress
        │   ├── PlannerPage.jsx    # 7-day grid weekly view
        │   ├── CalendarPage.jsx   # Monthly calendar with events
        │   └── SettingsPage.jsx   # Preferences, dark mode, goals
        ├── components/
        │   └── Layout.jsx         # Sidebar + mobile nav
        └── utils/
            └── api.js             # Axios instance with interceptors
```

---

##  Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or MongoDB Atlas)
- npm or yarn

---

### 1. Clone / Download the project

```bash
git clone <your-repo>
cd smart-learning-planner
```

---

### 2. Setup Backend

```bash
cd backend
npm install
```

Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

Edit `.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smart-learning-planner
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000
```

Start the backend:
```bash
npm run dev     # development (nodemon)
npm start       # production
```

Backend runs at: `http://localhost:5000`

---

### 3. Setup Frontend

```bash
cd ../frontend
npm install
```

Start the frontend:
```bash
npm start
```

Frontend runs at: `http://localhost:3000`

> The `proxy` field in `package.json` forwards `/api` requests to the backend automatically.

---

##  Smart Features Explained

### Smart Priority Score (0–100)
Automatically calculated on every save:

| Factor           | Max Points | Logic |
|------------------|-----------|-------|
| Urgency (deadline proximity) | 40 | ≤0 days = 40pts, ≤1 day = 35, ≤3 days = 25... |
| Manual Priority  | 30 | urgent=30, high=20, medium=10, low=5 |
| Progress (inverse) | 20 | Less complete = higher score |
| Hours remaining  | 10 | More hours left = higher score |

### Auto-Scheduling
When a task is created, it's automatically distributed across days:
- Calculates available days until deadline
- Divides hours across days (max 3h/day per task)
- Stores `scheduledDates[]` on the task

### Weekly Plan Generation
- Sorts tasks by smart priority
- Fills each day up to your `dailyGoalHours` goal
- Respects deadlines (won't schedule past the deadline)
- Ensures no day is overloaded

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/preferences` | Update preferences |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List tasks (with filters) |
| POST | `/api/tasks` | Create task (auto-schedules) |
| PUT | `/api/tasks/:id` | Update task |
| PATCH | `/api/tasks/:id/progress` | Update progress/status |
| DELETE | `/api/tasks/:id` | Delete task |

### Subjects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subjects` | List subjects |
| POST | `/api/subjects` | Create subject |
| PUT | `/api/subjects/:id` | Update subject |
| DELETE | `/api/subjects/:id` | Delete (removes tasks too) |

### Planner
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/planner/weekly?startDate=` | 7-day plan |
| GET | `/api/planner/today` | Today's tasks |
| GET | `/api/planner/calendar?year=&month=` | Monthly events |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | All stats + chart data |

---

## 🌟 Features

-  JWT Authentication (register/login)
-  Subject management with color & icon
-  Task CRUD with priority, deadline, estimated hours
-  Smart Priority Score (auto-calculated)
-  Auto task scheduling across days
-  Weekly planner view
-  Monthly calendar view
-  Dashboard with charts (recharts)
-  Progress tracking per task & subject
-  Dark mode 🌙
-  Responsive (mobile + desktop)
-  Daily reminder cron job (email)
-  Filter & sort tasks

---

##  Future Upgrades

### Add OpenAI Integration
In `backend/routes/planner.js`, add a new route:

```javascript
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/ai-plan', protect, async (req, res) => {
  const { tasks, availableHours } = req.body;
  const prompt = `Create a study plan for these tasks: ${JSON.stringify(tasks)}. 
  Available hours per day: ${availableHours}. Return JSON with daily schedule.`;
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }]
  });
  
  res.json({ plan: JSON.parse(completion.choices[0].message.content) });
});
```

### Add FullCalendar
```bash
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/interaction
```

Replace `CalendarPage.jsx` with FullCalendar for drag-and-drop scheduling.

---

