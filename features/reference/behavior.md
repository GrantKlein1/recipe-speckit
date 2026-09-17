# Behavior & Rules Reference

**Living snapshot** of product rules currently in force for shipped / implemented Feature 2 ingredients behavior.

| Rule | Enforcement | Provenance |
| ---- | ----------- | ---------- |
| Ingredients list ordered by name ascending | `Ingredient.findAll({ order: [["name", "ASC"]] })` | Feature 2 FR-001 |
| Shared global catalog (not per-user) | No `userId` on `ingredients`; any authed user may write | Feature 2 FR-011 |
| Reads may be unauthenticated | GET list/by id have no `authenticateRoute` | Feature 2 FR-005 |
| Creates/updates require session | POST/PUT use `authenticateRoute` | Feature 2 FR-003, FR-004 |
| Create requires name, unit, pricePerUnit | Controller returns `400` with message | Feature 2 FR-006 / US-2.5 |
| Add button only when signed in | `v-if="user !== null"` on Ingredients page | Feature 2 FR-008 |
| Unit choices in UI | Fixed unit list on Ingredients dialog select | Feature 2 FR-007 |
| Menu exposes Ingredients when signed in | MenuBar link to route `ingredients` | Feature 2 FR-012 |

These files answer: *"What rules does the app enforce right now?"*  
They do **not** authorize new scope — implement only from `features/feature-*.md`.

| File | Role |
|------|------|
| [api.md](./api.md) | Routes / payloads |
| [data-model.md](./data-model.md) | Tables / columns |
| **This file** | Ownership, sort, validation, UI rules |
