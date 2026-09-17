# Feature: Recipe Management

**Feature ID:** 3
**Branch pattern:** `feature-3-recipe-management`
**Status:** Ready
**Created:** 2026-09-17
**Input:** Signed-in users create, view, edit, and download their own recipes (name, description, servings, time); guests still only see published recipes from Feature 1
**Depends on:** [Feature 1 — User Authentication & Session Management](feature-1-account-management.md)
**Related:** `features/reference/api.md`, `features/reference/data-model.md`, `features/reference/behavior.md`

---

## User Stories

### US-3.1: Create a recipe

**As a** signed-in user
**I want to** add a recipe with a name, description, servings, and time to make
**So that** I can start building my own recipe collection

**Priority:** P1
**Independent test:** Sign in, click **Add**, submit valid fields; new recipe appears on the recipes page
**Acceptance scenarios:** see ### US-3.1 under Acceptance Criteria

### US-3.2: View my recipes

**As a** signed-in user
**I want to** see my recipes on the recipes page
**So that** I know what I have saved

**Priority:** P1
**Independent test:** Sign in; `GET /recipeapi/recipes/user/:userId` returns only that user’s recipes, ordered by name
**Acceptance scenarios:** see ### US-3.2 under Acceptance Criteria

### US-3.3: Edit a recipe

**As a** signed-in user
**I want to** change a recipe’s name, description, servings, and time
**So that** I can keep the recipe accurate

**Priority:** P1
**Independent test:** Open edit via the pencil icon, change fields, click **Update Recipe**; values persist after reload
**Acceptance scenarios:** see ### US-3.3 under Acceptance Criteria

### US-3.4: Download a recipe PDF

**As a** signed-in user
**I want to** download a PDF of a recipe from its card
**So that** I can cook from a printed copy

**Priority:** P2
**Independent test:** Signed in, click the PDF icon on a recipe card; a PDF download is triggered
**Acceptance scenarios:** see ### US-3.4 under Acceptance Criteria

### US-3.5: Private recipes only

**As a** signed-in user
**I want** my unpublished recipes visible and editable only by me
**So that** other users cannot change my recipes

**Priority:** P1
**Independent test:** Cross-user `PUT`/`DELETE` on a recipe returns `404`; signed-in list loads only the caller’s rows
**Acceptance scenarios:** see ### US-3.5 under Acceptance Criteria

### US-3.6: Nested recipe data is removed with the recipe

**As a** signed-in user
**I want** deleting a recipe to remove its steps and recipe-ingredient rows
**So that** I do not leave orphaned recipe data

**Priority:** P2
**Independent test:** `DELETE /recipeapi/recipes/:id` on an owned recipe removes nested `recipeStep` and `recipeIngredient` rows
**Acceptance scenarios:** see ### US-3.6 under Acceptance Criteria

---

## Requirements

### Functional Requirements

- **FR-001**: Create, update, and delete recipe endpoints MUST require a valid session (`authenticateRoute`).
- **FR-002**: A recipe MUST belong to exactly one user (`userId`) for its entire lifetime.
- **FR-003**: The signed-in recipes page MUST load that user’s recipes with `GET /recipeapi/recipes/user/:userId` (Bearer token). Guest published list remains Feature 1 (`GET /recipeapi/recipes/`).
- **FR-004**: Creating a recipe MUST require `name`, `description`, `servings`, `time`, `isPublished`, and `userId`. Missing any MUST return `400` with the matching empty-field `message` in API Requirements.
- **FR-005**: Updating a recipe that does not exist or is not owned by `req.user.id` MUST return `404` with `{ "message": "Cannot find Recipe with id=<id>." }` (not `403`).
- **FR-006**: The **Add** control on the recipes page MUST be visible only when a signed-in user is present in `localStorage`.
- **FR-007**: New recipes in the UI MUST default to `servings` `2`, `time` `30`, and `isPublished` `false`.
- **FR-008**: Signed-in users MUST open the recipe editor from the card pencil icon (`editRecipe`, `/recipe/:id`). Feature 1 already redirects unauthenticated visits to login.
- **FR-009**: Signed-in users MUST be able to download a recipe PDF from the card PDF icon. Guests MUST NOT see the PDF or pencil icons.
- **FR-010**: User recipe lists MUST be ordered by `name` ascending.
- **FR-011**: `isPublished` MUST be stored on create (API requires the field; UI default `false`). Toggling publish as a product capability and guest catalog behavior are Feature 5.
- **FR-012**: `GET` recipe payloads MAY include nested `recipeStep` / `recipeIngredient` / `ingredient`. Adding, editing, and deleting those nested rows is Feature 4.
- **FR-013**: Deleting a recipe MUST cascade-delete its `recipeStep` and `recipeIngredient` rows.
- **FR-014**: Every authenticated recipe write MUST resolve the owner from the session (`req.user.id`). Cross-user access MUST NOT use `403`.
- **FR-015**: Successful add MUST show snackbar `"{name} added successfully!"`. Successful update MUST show snackbar `"{name} updated successfully!"`. API failures MUST show a snackbar with the API `message`.

---

## Assumptions

- Feature 1 is on `dev` (session, `localStorage` key `user`, recipes route, MenuBar, guest published list, `editRecipe` guard).
- Feature 2 ingredient catalog is not required to create a recipe shell; attaching catalog ingredients is Feature 4.
- There is no delete-recipe control on the running recipes UI; `DELETE /recipeapi/recipes/:id` is an API contract for ownership and cascade tests.
- `GET /recipeapi/recipes/:id` is unauthenticated in the running API (the editor uses it after Feature 1’s route guard).
- No search, filter, tags, photos, or sharing.

---

## Edge Cases

- Missing `name`, `description`, `servings`, `time`, `isPublished`, or `userId` on create → `400` with the matching empty-field message.
- Unauthenticated `POST` / `PUT` / `DELETE` recipe → `401`.
- Update or delete of another user’s recipe → `404`.
- Guest on recipes page: published list from Feature 1; **Add**, pencil, and PDF icons hidden.
- Empty recipe list: running view has no empty-state sentence — do not invent one.

---

## Success Criteria

- **SC-001**: Every Gherkin scenario in this feature has at least one automated test before merge.
- **SC-002**: A signed-in user can add a recipe, see it on the recipes page, edit it, and download a PDF in one manual pass.
- **SC-003**: Another user’s recipe cannot be updated or deleted (`404`); `npm test` passes for the mapped tests.
- **SC-004**: Guests still do not see **Add** (Feature 1 published list is unchanged).

---

## Data Ownership & Isolation

Each user owns their recipes exclusively. Guests may **read** published recipes only (Feature 1 / Feature 5). This feature owns create/update/delete isolation for recipe rows.

| Rule | Requirement |
|------|-------------|
| **Read scope** | Signed-in `GET /recipeapi/recipes/user/:userId` returns only recipes for that user. Guests use `GET /recipeapi/recipes/` (`isPublished = true`) from Feature 1. `GET /recipeapi/recipes/:id` is unauthenticated (running API). |
| **Write scope** | `PUT` / `DELETE` `/recipeapi/recipes/:id` succeed only when the row’s `userId` is `req.user.id`. Otherwise `404`. |
| **Create scope** | `POST /recipeapi/recipes/` requires a session. The saved `userId` is the authenticated user (the UI sends `user.id` from `localStorage`). |
| **Cross-user access** | Another user’s recipe on update/delete → `404` (not `403`). |
| **UI scope** | Signed-in recipes view shows only that user’s recipes. **Add**, pencil, and PDF icons render only when `user` is in `localStorage`. |
| **Implementation** | `authenticateRoute` in `backend/app/authentication/authentication.js`. Ownership check matches existing `recipe.controller` update (`existing.userId !== req.user.id` → `404`). Do not invent a separate `app/authorization/` helper in this feature. |

---

## Key Entities

- **Recipe**: named recipe owned by one user; has description, servings, time, and `isPublished`; may have steps and recipe-ingredient rows (Feature 4).
- **User / Session**: required for create, update, delete, signed-in list, edit navigation, and PDF icon (Feature 1).

---

## API Requirements

Mount prefix: `/recipeapi` (see `backend/server.js`). Flat JSON; errors `{ "message": "…" }`. Do not wrap in `{ success, data }`.

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `POST` | `/recipeapi/recipes/` | Yes | Create a recipe |
| `GET` | `/recipeapi/recipes/user/:userId` | Yes | List recipes for a user, name ascending |
| `GET` | `/recipeapi/recipes/:id` | No | Fetch one recipe (array payload; editor uses `[0]`) |
| `PUT` | `/recipeapi/recipes/:id` | Yes | Update an owned recipe |
| `DELETE` | `/recipeapi/recipes/:id` | Yes | Delete an owned recipe |
| `DELETE` | `/recipeapi/recipes/` | Yes | Delete all recipes (API only; not a product action) |

Guest published list `GET /recipeapi/recipes/` is Feature 1 — do not redefine it here.

### Create — `POST /recipeapi/recipes/`

**Request body:**

```json
{
  "name": "Pancakes",
  "description": "Weekend breakfast",
  "servings": 4,
  "time": 20,
  "isPublished": false,
  "userId": 1
}
```

**Success** (`200`): recipe row JSON including `id`, `name`, `description`, `servings`, `time`, `isPublished`, `userId`, timestamps.

**Errors (`400`):**

| Condition | `message` |
|-----------|-----------|
| Missing `name` | `Name cannot be empty for recipe!` |
| Missing `description` | `Description cannot be empty for recipe!` |
| Missing `servings` | `Servings cannot be empty for recipe!` |
| Missing `time` | `Time cannot be empty for recipe!` |
| Missing `isPublished` | `Is Published cannot be empty for recipe!` |
| Missing `userId` | `User Id cannot be empty for recipe!` |

**Unauthorized:** `401` when the Bearer token is missing or invalid.

### List for user — `GET /recipeapi/recipes/user/:userId`

**Success** (`200`): JSON array of that user’s recipes, ordered by `name` ASC. Nested `recipeStep` (with `recipeIngredient` / `ingredient`) MAY be included; Feature 4 owns those child resources.

### Get one — `GET /recipeapi/recipes/:id`

**Success** (`200`): JSON **array** of matching recipes (running controller uses `findAll`). The editor reads `response.data[0]`.

### Update — `PUT /recipeapi/recipes/:id`

**Request body:** recipe fields to change (at least `name`, `description`, `servings`, `time` as edited on screen).

**Success:** `{ "message": "Recipe was updated successfully." }`

**Not found / not owned:** `404` `{ "message": "Cannot find Recipe with id=<id>." }`

### Delete — `DELETE /recipeapi/recipes/:id`

**Success:** `{ "message": "Recipe was deleted successfully!" }`

**Not found / not owned:** `404` `{ "message": "Cannot find Recipe with id=<id>." }`

**Error response (all):** `{ "message": "Human-readable explanation." }`

---

## Screen Requirements

Follow [ui-style-system.mdc](../.cursor/rules/ui-style-system.mdc) for theme tokens. Labels below match the running Recipe UI.

### [View: Recipe list] — route name `recipes` (`/recipes`)

Feature 1 already specifies who may open this screen and the guest published list. This feature adds signed-in create and card actions.

**Shell**

- Heading: **Recipes**
- Primary action: **Add** (`v-if="user !== null"`) — signed-in only
- **Error:** snackbar with API `message`
- No empty-state copy in the running view — do not invent one

**Recipe cards** (`RecipeCardComponent`)

- Show **name**, **servings** chip (`{n} Servings`), **time** chip (`{n} minutes`), and **description**
- Click the card to expand/collapse details. Expanded headings **Ingredients** and **Recipe Steps** are display-only here; add/edit/delete of those rows is Feature 4
- Signed-in only: PDF icon (`mdi-file-pdf-box`) downloads a PDF (`RecipeReports.generateRecipePDF`); `aria-label`: **Download PDF**
- Signed-in only: pencil icon (`mdi-pencil`) navigates to `editRecipe` with that recipe’s `id`; `aria-label`: **Edit recipe**

**Add Recipe dialog** (`v-dialog`)

- Title: **Add Recipe**
- Fields: **Name**, **Number of Servings**, **Time to Make (in minutes)**, **Description**
- Switch: **Publish? Yes** / **Publish? No** (default No / `false`). Product publish behavior is Feature 5; the control exists because create requires `isPublished`
- Actions: **Close**, **Add Recipe**
- On success: close dialog, refresh list, snackbar **`{name} added successfully!`**
- On failure: error snackbar with API `message`

### [View: Edit recipe] — route name `editRecipe` (`/recipe/:id`)

Session required (Feature 1). This feature owns the recipe **metadata** form only.

- Heading: **Edit Recipe**
- Fields: **Name**, **Number of Servings**, **Time to Make (in minutes)**, **Description**
- Primary action: **Update Recipe**
- On success: snackbar **`{name} updated successfully!`**, then reload the recipe
- On failure: error snackbar with API `message`
- **Publish?** switch on this screen is Feature 5
- **Ingredients** and **Steps** cards, **Add** / pencil / trash on those rows are Feature 4

### App chrome

- MenuBar **Recipes** already routes here (Feature 1). This feature does not add nav items.

---

## Data Model Requirements

### `recipes` table

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `name` | STRING | Required |
| `description` | STRING | Required |
| `servings` | INTEGER | Required |
| `time` | INTEGER | Required (minutes) |
| `isPublished` | BOOLEAN | Required; UI default `false` on create (Feature 5 owns publish behavior) |
| `userId` | INTEGER FK | Required; references `users.id`; `ON DELETE CASCADE` |
| `createdAt` | DATE | Sequelize timestamp |
| `updatedAt` | DATE | Sequelize timestamp |

### Associations

- `User` hasMany `Recipe`
- `Recipe` belongsTo `User`
- `Recipe` hasMany `RecipeStep` — `onDelete: CASCADE` (child CRUD is Feature 4)
- `Recipe` hasMany `RecipeIngredient` — `onDelete: CASCADE` (child CRUD is Feature 4)

---

## Acceptance Criteria (Gherkin)

### US-3.1 — Create a recipe

#### Scenario: Signed-in user adds a recipe

- **Given** I am signed in on the recipes page
- **When** I click **Add**
- **And** I enter name `Pancakes`, number of servings `4`, time to make `20`, and description `Weekend breakfast`
- **And** I click **Add Recipe**
- **Then** `POST /recipeapi/recipes/` returns `200` with a recipe whose `name` is `Pancakes`
- **And** the saved `userId` matches my authenticated user ID
- **And** `Pancakes` appears on the recipes page
- **And** I see a snackbar **`Pancakes added successfully!`**

#### Scenario: Add button is hidden when signed out

- **Given** I am not signed in on the recipes page
- **When** I view the page header actions
- **Then** I do not see the **Add** button

#### Scenario: Create without name is rejected

- **Given** I am signed in
- **When** I send `POST /recipeapi/recipes/` with a body missing `name` but including `description`, `servings`, `time`, `isPublished`, and `userId`
- **Then** the API returns `400` with `{ "message": "Name cannot be empty for recipe!" }`

#### Scenario: Create without description is rejected

- **Given** I am signed in
- **When** I send `POST /recipeapi/recipes/` with a body missing `description`
- **Then** the API returns `400` with `{ "message": "Description cannot be empty for recipe!" }`

#### Scenario: Create without servings is rejected

- **Given** I am signed in
- **When** I send `POST /recipeapi/recipes/` with a body missing `servings`
- **Then** the API returns `400` with `{ "message": "Servings cannot be empty for recipe!" }`

#### Scenario: Create without time is rejected

- **Given** I am signed in
- **When** I send `POST /recipeapi/recipes/` with a body missing `time`
- **Then** the API returns `400` with `{ "message": "Time cannot be empty for recipe!" }`

---

### US-3.2 — View my recipes

#### Scenario: Signed-in user views their recipes

- **Given** I am signed in
- **And** I own recipes `Pancakes` and `Chili`
- **When** I open the recipes page
- **Then** `GET /recipeapi/recipes/user/:userId` is called with my user id
- **And** I see recipe cards for `Pancakes` and `Chili`
- **And** each card shows name, servings, time, and description

#### Scenario: User recipes are ordered by name

- **Given** I am signed in
- **And** I own recipes named `Chili` and `Pancakes`
- **When** I request `GET /recipeapi/recipes/user/:userId`
- **Then** the API returns recipes ordered by name ascending

#### Scenario: User only sees their own recipes on the signed-in list

- **Given** I am signed in as user A
- **And** I own recipe `My Stew`
- **And** user B owns recipe `Their Stew`
- **When** I open the recipes page
- **Then** I see `My Stew`
- **And** I do not see `Their Stew`

---

### US-3.3 — Edit a recipe

#### Scenario: Signed-in user updates a recipe

- **Given** I am signed in
- **And** I own recipe `Pancakes` with servings `4`
- **When** I click the pencil icon on `Pancakes`
- **Then** I am on the edit recipe page
- **When** I change number of servings to `6`
- **And** I click **Update Recipe**
- **Then** `PUT /recipeapi/recipes/:id` returns `{ "message": "Recipe was updated successfully." }`
- **And** I see a snackbar **`Pancakes updated successfully!`**

#### Scenario: Pencil and PDF icons are hidden when signed out

- **Given** I am not signed in
- **And** a published recipe card is visible
- **When** I view that card
- **Then** I do not see the pencil icon
- **And** I do not see the PDF icon

---

### US-3.4 — Download a recipe PDF

#### Scenario: Signed-in user downloads a recipe PDF

- **Given** I am signed in on the recipes page
- **And** I own recipe `Pancakes`
- **When** I click the PDF icon on the `Pancakes` card
- **Then** a recipe PDF download is triggered for that recipe

---

### US-3.5 — Private recipes only

#### Scenario: User attempts to update another user's recipe

- **Given** I am signed in as user A
- **And** a recipe exists that belongs to user B
- **When** I send `PUT /recipeapi/recipes/:id` with a body changing the name
- **Then** the API returns `404` with `{ "message": "Cannot find Recipe with id=<id>." }`
- **And** user B’s recipe name is unchanged

#### Scenario: User attempts to delete another user's recipe

- **Given** I am signed in as user A
- **And** a recipe exists that belongs to user B
- **When** I send `DELETE /recipeapi/recipes/:id`
- **Then** the API returns `404` with `{ "message": "Cannot find Recipe with id=<id>." }`
- **And** user B’s recipe still exists

#### Scenario: Unauthenticated create is rejected

- **Given** I have no valid session token
- **When** I send `POST /recipeapi/recipes/` with a valid body
- **Then** the API returns `401`

#### Scenario: Unauthenticated update is rejected

- **Given** I have no valid session token
- **And** a recipe with id `1` exists
- **When** I send `PUT /recipeapi/recipes/1` with a body changing the name
- **Then** the API returns `401`

---

### US-3.6 — Nested recipe data is removed with the recipe

#### Scenario: Deleting a recipe removes its steps and recipe ingredients

- **Given** I am signed in
- **And** I own recipe `Pancakes` with at least one recipe step and one recipe ingredient
- **When** I send `DELETE /recipeapi/recipes/:id` for that recipe
- **Then** the API returns `{ "message": "Recipe was deleted successfully!" }`
- **And** that recipe’s step and recipe-ingredient rows are gone from the database

---

## Test Coverage Map

Each scenario above must map to at least one automated test.

| Story | Scenario | Test file | Test name |
|-------|----------|-----------|-----------|
| US-3.1 | Signed-in user adds a recipe | `backend/tests/recipes.test.js`, `frontend/tests/RecipeList.test.js` | `it("Signed-in user adds a recipe")` |
| US-3.1 | Add button is hidden when signed out | `frontend/tests/RecipeList.test.js` | `it("Add button is hidden when signed out")` |
| US-3.1 | Create without name is rejected | `backend/tests/recipes.test.js` | `it("Create without name is rejected")` |
| US-3.1 | Create without description is rejected | `backend/tests/recipes.test.js` | `it("Create without description is rejected")` |
| US-3.1 | Create without servings is rejected | `backend/tests/recipes.test.js` | `it("Create without servings is rejected")` |
| US-3.1 | Create without time is rejected | `backend/tests/recipes.test.js` | `it("Create without time is rejected")` |
| US-3.2 | Signed-in user views their recipes | `frontend/tests/RecipeList.test.js` | `it("Signed-in user views their recipes")` |
| US-3.2 | User recipes are ordered by name | `backend/tests/recipes.test.js` | `it("User recipes are ordered by name")` |
| US-3.2 | User only sees their own recipes on the signed-in list | `backend/tests/recipes.test.js` | `it("User only sees their own recipes on the signed-in list")` |
| US-3.3 | Signed-in user updates a recipe | `backend/tests/recipes.test.js`, `frontend/tests/EditRecipe.test.js` | `it("Signed-in user updates a recipe")` |
| US-3.3 | Pencil and PDF icons are hidden when signed out | `frontend/tests/RecipeCard.test.js` | `it("Pencil and PDF icons are hidden when signed out")` |
| US-3.4 | Signed-in user downloads a recipe PDF | `frontend/tests/RecipeCard.test.js` | `it("Signed-in user downloads a recipe PDF")` |
| US-3.5 | User attempts to update another user's recipe | `backend/tests/recipes.test.js` | `it("User attempts to update another user's recipe")` |
| US-3.5 | User attempts to delete another user's recipe | `backend/tests/recipes.test.js` | `it("User attempts to delete another user's recipe")` |
| US-3.5 | Unauthenticated create is rejected | `backend/tests/recipes.test.js` | `it("Unauthenticated create is rejected")` |
| US-3.5 | Unauthenticated update is rejected | `backend/tests/recipes.test.js` | `it("Unauthenticated update is rejected")` |
| US-3.6 | Deleting a recipe removes its steps and recipe ingredients | `backend/tests/recipes.test.js` | `it("Deleting a recipe removes its steps and recipe ingredients")` |

---

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 3 from @features/feature-3-recipe-management.md on branch `feature-3-recipe-management`.

Follow layer order in @features/framework.md (models → routes → backend tests → frontend → frontend tests).
Map every Gherkin scenario in the Test Coverage Map; run `npm test` before finishing.
If API routes, payloads, schema, or product rules changed per this spec, update @features/reference/api.md, @features/reference/data-model.md, and/or @features/reference/behavior.md in the same PR to match shipped code.
Complete Definition of Done and the merge checklist in @features/framework.md.
Do not implement behavior not in this spec.
```

**Reference updates for this feature:** `features/reference/api.md`, `features/reference/data-model.md`, `features/reference/behavior.md`

---

## Definition of Done

- [ ] Backend and frontend implemented per this spec (**FR-001**–**FR-015** satisfied)
- [ ] **Success Criteria (SC-001**–**SC-004)** met
- [ ] All mapped tests pass (`npm test`)
- [ ] Test Coverage Map complete
- [ ] `features/reference/data-model.md` updated (if schema changed)
- [ ] `features/reference/api.md` updated (if API changed)
- [ ] `features/reference/behavior.md` updated (if product rules changed)

---

## Out of Scope

- Guest published-recipe list and unauthenticated `GET /recipeapi/recipes/` ([Feature 1](./feature-1-account-management.md))
- Ingredient catalog CRUD ([Feature 2](./feature-2-ingredients-management.md))
- Adding, editing, or deleting recipe steps and recipe-ingredient rows ([Feature 4](./feature-4-recipe-ingredients-management.md))
- Publish as a product action (guest catalog, edit-screen toggle behavior) ([Feature 5](./feature-5-published-recipe-management.md))
- Delete-recipe button on the recipes UI (API `DELETE` only)
- Bulk delete-all recipes as a product action
- Search, filter, tags, photos, or sharing recipes

## Delivered to Feature 4

- Recipe cards may expand to **show** ingredients and steps. Feature 4 owns create/update/delete of those nested rows on **Edit Recipe**.

## Delivered to Feature 5

- Create stores `isPublished` (default `false`). The **Publish?** switch on **Edit Recipe** and guest visibility of published recipes are Feature 5.
