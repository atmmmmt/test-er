# Warehouse SaaS ERP

Professional warehouse SaaS ERP platform built as a monorepo.

## Apps

- apps/api: Express TypeScript MongoDB API
- apps/web: React Vite frontend dashboard
- packages/shared: shared feature constants and types

## Local links

Frontend: http://localhost:5173
Backend health: http://localhost:5000/health
API root: http://localhost:5000/api/v1
Reports: http://localhost:5000/api/v1/reports/overview

## Run locally

1. npm install
2. copy .env.example to .env
3. npm run dev:api
4. npm run dev:web

Keep real service keys inside .env only.
