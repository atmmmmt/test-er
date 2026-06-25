# Current Test Scenario

Run backend and frontend, then open the web app.

Current frontend shell includes:
- login
- setup
- owner
- tenant
- products
- categories
- warehouses
- suppliers
- customers
- orders
- sales
- movements
- reports
- mobile

Current working API modules:
- tenants
- roles
- users
- products
- categories
- warehouses
- suppliers
- customers
- purchases
- sales
- balances
- movements
- reports overview

Recommended test:
1. open setup page
2. create a company
3. create products
4. create warehouse
5. create supplier and customer
6. create inbound order
7. create sale
8. add movement
9. open reports

Next required work:
- connect auth to real login
- mount billing router in api app
- connect stock flow endpoints
- add production validations
- add seed command
