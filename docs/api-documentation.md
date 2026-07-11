# API Documentation

Swagger UI is available when the backend is running:

```txt
http://localhost:5000/api/docs
```

Raw OpenAPI JSON:

```txt
http://localhost:5000/api/docs.json
```

Postman can import the same OpenAPI JSON:

1. Open Postman.
2. Select **Import**.
3. Choose **Link**.
4. Paste `http://localhost:5000/api/docs.json`.
5. Import as a collection.

For protected endpoints, login first:

```txt
POST /api/auth/login
```

Then set the returned token in Postman:

```txt
Authorization: Bearer <token>
```
