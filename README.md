# Zen Board

A minimal kanban board for personal task management. Drag tasks between columns, assign team members, tag with labels, and filter by priority — all in a clean, responsive UI backed by Supabase.

**Live:** [zenboard-saksham.vercel.app](https://zenboard-saksham.vercel.app/)

## Features

- **Kanban drag-and-drop** — Move tasks across To Do, In Progress, In Review, and Done columns with optimistic UI updates
- **Task detail panel** — Click any card to view/edit title, description, priority, due date, status, labels, and assignees
- **Labels** — Create color-coded labels and filter tasks by them
- **Team members** — Add members with colored avatars, assign multiple per task
- **Search and filtering** — Real-time title search, priority filter, assignee filter, label filter — all composable
- **Board stats** — Total, done (green), and overdue (red) counts in the header
- **Due date indicators** — Color-coded urgency: red (overdue), amber (today/tomorrow), muted (future)
- **Priority sorting** — Tasks sort High > Normal > Low within each column
- **No sign-up required** — Anonymous auth via Supabase; session persists across refreshes

## Tech Stack

Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Supabase (Postgres + Auth + RLS) · dnd-kit

## Local Setup

```bash
git clone https://github.com/saksham-2000/zen-board.git
cd zen-board
npm install
```

Create `.env.local` with your Supabase project credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Apply the database schema from `SUBMISSION.md` (Section 4) in the Supabase SQL Editor, then:

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000).
