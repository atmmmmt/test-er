# Deploy Guide

## Local run

```bash
npm install
copy .env.example .env
npm run dev:api
npm run dev:web
```

Frontend:

```txt
http://localhost:5173
```

Backend:

```txt
http://localhost:5000/health
http://localhost:5000/api/v1
```

## Required environment

```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_ACCESS_SECRET=change_me_long_secret
JWT_REFRESH_SECRET=change_me_long_secret
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Frontend deploy

Set this environment variable in the hosting platform:

```env
VITE_API_URL=https://your-api-domain.com/api/v1
```

Build command:

```bash
npm run build --workspace @warehouse/web
```

## Backend deploy

Install dependencies and build:

```bash
npm install
npm run build --workspace @warehouse/api
```

Start with PM2:

```bash
pm2 start apps/api/dist/server.js --name warehouse-api
pm2 save
```

## Test scenario

1. Open web app.
2. Go to setup.
3. Create company and first user.
4. Login with the same email and password.
5. Go to seed and create default plans.
6. Create products, warehouses, suppliers, customers.
7. Use reports to verify data.
8. Use settings to store tenant and warehouse ids.
9. Use mobile page to test receive, issue, and transfer flows.
