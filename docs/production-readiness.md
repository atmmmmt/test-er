# Production Readiness

Current status: production foundation is implemented. Final readiness now depends on build verification, live deployment, and the remaining PWA polish.

## Completed

- API app structure
- MongoDB models
- Tenant model
- User model
- Login with JWT
- Password hashing for setup users
- Protected internal routes
- Tenant-scoped CRUD
- Permission map foundation
- Permissions enforced on protected route groups
- Roles page
- Role permission normalization
- Products
- Categories
- Warehouses
- Suppliers
- Customers
- Purchases
- Sales
- Purchase confirmation endpoint
- Sale confirmation endpoint
- Stock balances
- Stock movements
- Negative stock prevention
- Stock movement validation
- Stock receive endpoint
- Stock issue endpoint
- Stock transfer endpoint
- Reports overview
- Plans
- Subscriptions
- Demo seed
- API map documentation
- Web shell
- Localized navigation labels
- Setup page
- Login page
- CRUD pages
- CRUD validation and status messages
- Confirm operations page
- Barcode product picker page
- Mobile operation page with product and quantity
- Deployment guide
- Render backend config
- Vercel frontend config
- Build workflow
- Check script

## Remaining

- Run GitHub Actions and fix build errors
- Add toast notifications
- Add camera-based barcode scanner
- Add PWA service worker and icons
- Deploy backend to a live URL
- Deploy frontend to a live URL
- Add production domain and SSL

## Build note

API TypeScript strict mode is relaxed for build stability during MVP hardening. Re-enable strict mode gradually after the deployed version is stable.

## Demo credentials after seed

Email: admin@demo.com
Password: demo12345
