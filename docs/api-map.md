# API Map

Base URL:

```txt
/api/v1
```

## Public

- GET /
- POST /tenants
- POST /secure-users
- POST /session/login
- POST /seed/plans
- POST /seed/demo

## Protected

All protected routes require:

```txt
Authorization: Bearer <accessToken>
```

## Protected modules

- GET/POST /tenants
- GET/POST /roles
- GET/POST /plans
- GET/POST /subscriptions
- GET/POST /users
- GET/POST /products
- GET/POST /categories
- GET/POST /warehouses
- GET/POST /suppliers
- GET/POST /customers
- GET/POST /purchases
- GET/POST /sales
- GET/POST /balances
- GET/POST /movements

## Stock operations

- POST /stock/receive
- POST /stock/issue
- POST /stock/move

## Confirm operations

- POST /purchases/:id/confirm
- POST /sales/:id/confirm

## Reports

- GET /reports/overview
