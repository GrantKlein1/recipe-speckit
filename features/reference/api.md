# API Reference

**Status:** living snapshot for Feature 2 ingredients catalog (plus existing Recipe auth mount).

API mount path: `/recipeapi` (see `backend/server.js` route registration).

## Endpoints

### Ingredients

| Method | Endpoint | Auth | Purpose |
| ------ | -------- | ---- | ------- |
| GET | `/recipeapi/ingredients/` | No | List all ingredients ordered by `name` ASC |
| GET | `/recipeapi/ingredients/:id` | No | Fetch one ingredient |
| POST | `/recipeapi/ingredients/` | Yes | Create an ingredient |
| PUT | `/recipeapi/ingredients/:id` | Yes | Update an ingredient |
| DELETE | `/recipeapi/ingredients/:id` | Yes | Delete one ingredient |
| DELETE | `/recipeapi/ingredients/` | Yes | Delete all ingredients |

**Create body:** `{ "name": "Flour", "unit": "cup", "pricePerUnit": 0.45 }`

**Create success:** ingredient row JSON (`id`, `name`, `unit`, `pricePerUnit`, timestamps).

**Update success:** `{ "message": "Ingredient was updated successfully." }`

**Validation errors:** `400` with `{ "message": "..." }` when `name`, `unit`, or `pricePerUnit` is missing on create.

**Unauthorized:** `401` when Bearer session is missing/invalid on protected routes.

## Conventions

- Flat JSON responses (no `{ success, data }` envelope).
- Errors: `{ "message": "..." }`.
- Authenticated routes: `Authorization: Bearer <token>`.
