# Test Flow

1. Run API and web.
2. Open the web app.
3. Go to seed and create demo data.
4. Login with admin@demo.com and demo12345.
5. Open reports and verify demo counts.
6. Open settings and verify tenantId and storageId are saved.
7. Create product, warehouse, supplier, and customer records.
8. Create purchase and sale records.
9. Open confirm page and confirm purchase or sale.
10. Open movements and balances to verify stock changes.
11. Open mobile page.
12. Enter productId and quantity.
13. Test receive, pick, and transfer flows.

Notes:
- Protected pages require login.
- Access token is stored in localStorage.
- Tenant data is scoped by tenantId.
- Demo seed returns tenant and warehouse ids.
