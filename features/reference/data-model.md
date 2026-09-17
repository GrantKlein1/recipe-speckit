# Data Model Reference

**Status:** living snapshot — Feature 2 ingredients catalog table.

## Tables

### `ingredients`

| Field | Type | Rules |
| ----- | ---- | ----- |
| `id` | INTEGER PK | Auto-increment |
| `name` | STRING | Required |
| `unit` | STRING | Required |
| `pricePerUnit` | DECIMAL(10, 2) | Set on create via API validation |
| `createdAt` | DATE | Sequelize timestamp |
| `updatedAt` | DATE | Sequelize timestamp |

No `userId` — ingredients are a shared global catalog.

## Associations

- `ingredient` hasMany `recipeIngredient` (owned by later recipe-ingredient features)
- Feature 2 does not require user ownership associations on `ingredients`
