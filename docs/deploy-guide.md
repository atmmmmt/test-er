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

## Render backend deploy

The repository includes `render.yaml`.

Required Render env vars:

```env
MONGO_URI=your_mongodb_uri
JWT_ACCESS_SECRET=change_me_long_secret
JWT_REFRESH_SECRET=change_me_long_secret
WEB_URL=https://your-frontend-domain.com
```

Build command:

```bash
npm install && npm run build -w apps/api
```

Start command:

```bash
npm run start -w apps/api
```

## Vercel frontend deploy

The repository includes `vercel.json`.

Required Vercel env var:

```env
VITE_API_URL=https://your-api-domain.com/api/v1
```

Build command:

```bash
npm install && npm run build -w apps/web
```

Output directory:

```txt
apps/web/dist
```

## VPS backend deploy

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
2. Go to seed and create demo data.
3. Login with admin@demo.com and demo12345.
4. Open reports and verify counts.
5. Use settings to store tenant and warehouse ids.
6. Use barcode to select product.
7. Use mobile page to test receive, issue, and transfer flows.
8. Create purchase and sale records.
9. Use confirm page to confirm purchase and sale.
10. Use movements and balances to verify stock changes.
