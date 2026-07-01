# Build Check

Run from repository root:

```bash
npm install
npm run check
```

Expected result:

```txt
API build passes
Web build passes
```

If API build fails, check:

- missing imports
- environment config
- model typing
- route typing

If Web build fails, check:

- strict TypeScript errors
- missing page imports
- invalid component props
- browser API typing

Before deploy:

- set MongoDB URI
- set JWT secrets
- set frontend API URL
- keep seed disabled in production
