# Urban Furniture Accounting System

Full-stack accounting foundation: React/Vite frontend, Express API, Prisma, and PostgreSQL.

## Prerequisites

- Node.js 20+
- PostgreSQL 15+

## Setup

1. Copy `backend/.env.example` to `backend/.env` and set `DATABASE_URL` and `JWT_SECRET`.
2. Install dependencies: `npm install`
3. Generate Prisma client: `npm run db:generate`
4. Create the database schema: `npm run db:migrate -- --name init`
5. Start both apps: `npm run dev`

Frontend: `http://localhost:5173`  
API: `http://localhost:4000/api/health`

The dashboard health card calls the API and reports both API and database connectivity.
