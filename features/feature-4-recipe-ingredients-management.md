# Feature: Todo List Item Management

**Feature ID:** 4
**Branch pattern:** `feature/4-recipe-ingredients-management`
**Status:** Ready
**Created:** 2026-09-10
**Input:** Signed-in users manage recipe ingredients and steps per recipe via dialogs opened from ingredient rows (ingredients, add, edit, delete)
**Depends on:** [Feature 1 — Account Management](feature-1-account-management.md), [Feature 2 — Ingredient Management](feature-2-ingredient-management.md), [Feature 3 — Recipe Management](feature-3-recipe-management.md)

---

## User Stories

### US-4.1: Add ingredients to a recipe
**As a** signed-in user  
**I want to** add recipe ingredients to a recipe from its ingredient dialog  
**So that** I can track what ingredients are needed for a recipe

**Priority:** P1  
**Independent test:** Open ingredient dialog for a recipe, add a ingredient via add-ingredient dialog; it appears in the recipe list with `completed: false`  
**Acceptance scenarios:** see ### US-4.1 under Acceptance Criteria

### US-4.2: Add steps to a recipe
**As a** signed-in user  
**I want to** add recipe step to a recipe from its step dialog  
**So that** I can track what steps are needed for a recipe

**Priority:** P1  
**Independent test:** Open steps dialog for a recipe, add a step via add-step dialog; it appears in the recipe list with `completed: false`  
**Acceptance scenarios:** see ### US-4.2 under Acceptance Criteria

### US-4.3: View ingredients in a recipe
**As a** signed-in user  
**I want to** open a recipe's ingredient dialog and see all ingredients for that recipe  
**So that** I know what ingredients belongs to that group

**Priority:** P1  
**Independent test:** Open ingredients dialog on ingredient list rows; each dialog shows only that recipe's ingredients  
**Acceptance scenarios:** see ### US-4.3 under Acceptance Criteria

### US-4.4: View steps in a recipe
**As a** signed-in user  
**I want to** open a recipe's step dialog and see all steps for that recipe  
**So that** I know what step belongs to that group

**Priority:** P1  
**Independent test:** Open items dialog on different list rows; each dialog shows only that recipe's steps  
**Acceptance scenarios:** see ### US-4.4 under Acceptance Criteria

### US-4.5: Edit and remove ingredients
**As a** signed-in user  
**I want to** edit or delete individual ingredients  
**So that** I can keep my recipe accurate

**Priority:** P2  
**Independent test:** Edit quantity and delete ingredients via UI; changes persist after refresh  
**Acceptance scenarios:** see ### US-4.5 under Acceptance Criteria

### US-4.6: Edit and remove steps
**As a** signed-in user  
**I want to** edit or delete individual steps  
**So that** I can keep my recipe accurate

**Priority:** P2  
**Independent test:** Edit number, description, and ingredients and delete step via UI; changes persist after refresh  
**Acceptance scenarios:** see ### US-4.6 under Acceptance Criteria

### US-4.7: recipes carry their steps
**As a** signed-in user  
**I want** deleting a recipe to remove its recipe steps  
**So that** I do not leave orphaned steps in the database

**Priority:** P2  
**Independent test:** Delete recipe with steps; steps are gone from database  
**Acceptance scenarios:** see ### US-4.7 under Acceptance Criteria

---

## Requirements

### Functional Requirements

- **FR-001**: Create, update, and delete of recipe ingredients and recipe steps MUST require a valid session (`authenticateRoute`). Unauthenticated writes MUST return `401`.
- **FR-002**: A recipe ingredient MUST belong to exactly one recipe for its entire lifetime. A recipe step MUST belong to exactly one recipe for its entire lifetime.
- **FR-003**: Before creating a recipe ingredient or recipe step, the parent recipe MUST be owned by `req.user.id`; otherwise return `404`.
- **FR-004**: Update and delete of a recipe ingredient or recipe step MUST succeed only when the parent recipe is owned by `req.user.id`; otherwise return `404`.
- **FR-005**: Ownership MUST come from the authenticated session and the parent recipe — ignore any client-supplied `userId`.
- **FR-006**: Creating a recipe ingredient MUST require `quantity` and `ingredientId`. Missing either MUST be rejected (`400`).
- **FR-007**: `ingredientId` MUST refer to an existing catalog ingredient (Feature 2). Users MUST NOT create a new catalog ingredient from this flow.
- **FR-008**: `recipeStepId` on a recipe ingredient MAY be omitted; if omitted it MUST be stored as null.
- **FR-009**: Creating a recipe step MUST require `stepNumber` and `instruction`. Missing either MUST be rejected (`400`).
- **FR-010**: `instruction` MUST be a non-empty string with max length 5000.
- **FR-011**: Listing recipe ingredients for a recipe MUST return only that recipe’s ingredients, including catalog `name`, `unit`, and `pricePerUnit`.
- **FR-012**: Listing recipe steps for a recipe MUST return only that recipe’s steps, ordered by `stepNumber` ascending.
- **FR-013**: A step listing MAY include the recipe ingredients linked to that step.
- **FR-014**: Users MUST be able to update a recipe ingredient’s `quantity` and `ingredientId`.
- **FR-015**: Users MUST be able to delete a recipe ingredient from a recipe without deleting the catalog ingredient.
- **FR-016**: Users MUST be able to update a recipe step’s `stepNumber` and `instruction`, and which recipe ingredients are linked to it.
- **FR-017**: Users MUST be able to delete a recipe step.
- **FR-018**: When adding or editing a step, the user MAY select zero or more of that recipe’s existing recipe ingredients; those rows MUST have `recipeStepId` set to that step.
- **FR-019**: Deleting a recipe MUST delete all of its recipe steps and recipe ingredients (cascade).
- **FR-020**: Recipe ingredients and steps MUST be managed on the Edit Recipe screen for an owned recipe: Ingredients and Steps sections, each with add/edit dialogs. Add/edit/delete MUST NOT live on the main recipe list.

---

## Assumptions

- Features 1–2-3 MUST be merged to `dev` before implementing this feature (auth, recipes, ingredients, single-view dashboard, `MenuBar` with sign-out).
- Published recipes are out of scope (Feature 5).
- No drag-and-drop reorder, search, or sharing.

## Edge Cases

- Add/edit dialogs closed on Edit Recipe → no add UI on the main recipe list; no create API call until the user opens an add-ingredient or add-step dialog (FR-020).
- Empty or missing ingredient `quantity` → client block and/or `400` (FR-006).
- Missing `ingredientId` → client block and/or `400` (FR-006).
- `ingredientId` that does not exist in the catalog → `400` or `404`; no recipe ingredient created (FR-007).
- Empty or missing `stepNumber` or `instruction` → client block and/or `400` (FR-009).
- `instruction` longer than 5000 characters → `400` (FR-010).
- Parent recipe owned by another user (create, update, or delete ingredient/step) → `404` (FR-003, FR-004).
- Client sends a spoofed `userId` on create → ignored; ownership stays on the authenticated user and parent recipe (FR-005).
- Unauthenticated create/update/delete of a recipe ingredient or recipe step → `401` (FR-001).
- Recipe ingredient created without `recipeStepId` → stored as `null` (FR-008).
- Delete a recipe ingredient → catalog ingredient remains (FR-015).
- Delete a recipe that has steps and ingredients → those steps and recipe ingredients are removed (FR-019).

## Success Criteria

- **SC-001**: Every Gherkin scenario has at least one automated test before merge.
- **SC-002**: A signed-in user can add, view, edit, and delete ingredients and steps on an owned recipe end-to-end from the Edit Recipe screen.
- **SC-003**: Deleting a recipe removes its recipe steps and recipe ingredients; `npm test` passes.
- **SC-004**: A user cannot create, update, or delete ingredients or steps on another user’s recipe (`404`).

---

## Data Ownership & Isolation



---

## API Requirements



---

## Screen Requirements



---

## Key Entities

- **RecipeIngredient**: a quantity of a catalog ingredient used on one recipe; optionally linked to one recipe step.
- **RecipeStep**: a numbered instruction on one recipe; may reference that recipe’s ingredients.
- **Recipe**: parent container for steps and recipe ingredients (Feature 3); deleting a recipe removes its steps and recipe ingredients.
- **Ingredient**: shared catalog item with name, unit, and price (Feature 2); recipe ingredients reference it and MUST NOT delete it when a recipe line is removed.
- **User**: account that owns recipes (Feature 1); ownership of steps and recipe ingredients is through the parent recipe.

---

## Data Model Requirements

### `recipeSteps` table
| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `recipeId` | INTEGER FK | Required; references `recipes.id`; cascade on recipe delete |
| `stepNumber` | INTEGER | Required |
| `instruction` | STRING(5000) | Required; max 5000 chars |
| `createdAt` | DATE | Sequelize timestamps |
| `updatedAt` | DATE | Sequelize timestamps |

### `recipeIngredients` table
| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `recipeId` | INTEGER FK | Required; references `recipes.id`; cascade on recipe delete |
| `ingredientId` | INTEGER FK | Required; references `ingredients.id` |
| `recipeStepId` | INTEGER FK | Optional; references `recipeSteps.id`; null if the line is not tied to a step |
| `quantity` | FLOAT | Required |
| `createdAt` | DATE | Sequelize timestamps |
| `updatedAt` | DATE | Sequelize timestamps |

No `userId` on either table. Ownership is through the parent recipe (`recipes.userId`).

### Associations (add to `models/index.js`)
*   `Recipe hasMany RecipeStep` — `onDelete: CASCADE`
*   `RecipeStep belongsTo Recipe`
*   `Recipe hasMany RecipeIngredient` — `onDelete: CASCADE`
*   `RecipeIngredient belongsTo Recipe`
*   `Ingredient hasMany RecipeIngredient`
*   `RecipeIngredient belongsTo Ingredient`
*   `RecipeStep hasMany RecipeIngredient`
*   `RecipeIngredient belongsTo RecipeStep` — `recipeStepId` optional (`allowNull: true`)

---

## Acceptance Criteria (Gherkin)

### US-4.1 — Add ingredients to a recipe

#### Scenario: User adds a todo to a list via dialog
*   **Given** I am signed in on the dashboard
*   **And** I own list `Groceries`
*   **When** I click the **Items** icon on the `Groceries` row
*   **And** I click **+ Add Item**
*   **And** I enter todo title `Buy milk`
*   **And** I confirm the add-item dialog
*   **Then** the API returns `201` with a todo object where `completed` is `false`
*   **And** the returned `userId` matches my authenticated user ID
*   **And** the returned `listId` matches `Groceries`
*   **And** `Buy milk` appears in the list-items dialog

#### Scenario: User adds a todo with an empty title
*   **Given** I am signed in
*   **And** I have opened the items dialog for an owned list
*   **When** I open the add-item dialog
*   **And** I leave the todo title empty
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"Todo title is required."**
*   **And** no API request is sent

#### Scenario: Add item is only available inside the items dialog
*   **Given** I am signed in on the dashboard
*   **And** the list-items dialog is not open
*   **When** I view the lists view
*   **Then** I do not see an add-todo field or **+ Add Item** control on the main lists view

---

### US-4.2: Add steps to a recipe

#### Scenario: List items dialog shows empty state
*   **Given** I am signed in
*   **And** I own an empty list `Personal`
*   **When** I open the items dialog for `Personal`
*   **And** the todos finish loading
*   **Then** I see **"No todos in this list yet."**

#### Scenario: User opens items for different lists
*   **Given** I am signed in
*   **And** list `Work` has todos `Email client` and `Write report`
*   **And** list `Personal` has todo `Call mom`
*   **When** I open the items dialog for `Personal`
*   **Then** I see only `Call mom`
*   **When** I close the items dialog
*   **And** I open the items dialog for `Work`
*   **Then** I see `Email client` and `Write report`

#### Scenario: User only sees their own todos when opening items
*   **Given** I am signed in as user A
*   **And** I own list `Work` with todo `My task`
*   **And** user B owns list `Work` with todo `Their task` (same list name, different owner)
*   **When** I open the items dialog for my `Work` list
*   **Then** I see only `My task`
*   **And** I do not see `Their task`

---

### US-4.3: View ingredients in a recipe

#### Scenario: User marks a todo as complete
*   **Given** I am signed in
*   **And** I have opened the items dialog for a list containing todo `Buy milk` with `completed: false`
*   **When** I check the todo's checkbox
*   **Then** the API returns `200` with `completed: true`
*   **And** the todo displays as completed (struck-through or muted)

#### Scenario: User marks a completed todo as incomplete
*   **Given** I am signed in
*   **And** I have opened the items dialog for a list containing todo `Buy milk` with `completed: true`
*   **When** I uncheck the todo's checkbox
*   **Then** the API returns `200` with `completed: false`
*   **And** the todo displays as active again

---

### US-4.4: View steps in a recipe

#### Scenario: User edits a todo title
*   **Given** I am signed in
*   **And** I have opened the items dialog for a list containing todo `Buy milk`
*   **When** I click the edit icon on `Buy milk`
*   **And** I change the title to `Buy oat milk` in the edit dialog
*   **And** I confirm
*   **Then** the API returns `200` with the updated title
*   **And** the list-items dialog shows `Buy oat milk`

#### Scenario: User deletes a todo
*   **Given** I am signed in
*   **And** I have opened the items dialog for a list containing todo `Buy milk`
*   **When** I click the delete icon on `Buy milk`
*   **And** I confirm
*   **Then** the API returns `200` or `204`
*   **And** the todo is removed from the list-items dialog

---

### US-4.5: Edit and remove ingredients

#### Scenario: User cannot read todos in another user's list
*   **Given** I am signed in as user A
*   **And** user B owns list `Secret` with todo `Hidden task`
*   **When** I request `GET /todo/lists/:listId/todos` with user B's list ID
*   **Then** the API returns `404` with `{ "message": "List with id=<id> not found." }`
*   **And** `Hidden task` is not returned to user A

#### Scenario: User attempts to add a todo to another user's list
*   **Given** I am signed in as user A
*   **And** a list exists that belongs to user B
*   **When** I send `POST /todo/lists/:listId/todos` with user B's list ID and body `{ "title": "Intruder task" }`
*   **Then** the API returns `404` with `{ "message": "List with id=<id> not found." }`
*   **And** no todo is created in user B's list

#### Scenario: User attempts to rename another user's todo
*   **Given** I am signed in as user A
*   **And** a todo exists that belongs to user B
*   **When** I send `PUT /todo/todos/:id` with body `{ "title": "Hijacked" }`
*   **Then** the API returns `404` with `{ "message": "Todo with id=<id> not found." }`
*   **And** user B's todo title is unchanged in the database

#### Scenario: User attempts to delete another user's todo
*   **Given** I am signed in as user A
*   **And** a todo exists that belongs to user B
*   **When** I send `DELETE /todo/todos/:id`
*   **Then** the API returns `404` with `{ "message": "Todo with id=<id> not found." }`
*   **And** user B's todo still exists

#### Scenario: Client cannot assign a todo to another user on create
*   **Given** I am signed in as user A
*   **And** I own list `Groceries`
*   **When** I send `POST /todo/lists/:listId/todos` with body `{ "title": "Buy milk", "userId": 999 }` where user `999` is a different user
*   **Then** the API returns `201` with a todo owned by user A
*   **And** the saved `userId` is user A's ID, not `999`

#### Scenario: Unauthenticated API request for todos
*   **Given** I have no valid session token
*   **When** I request `GET /todo/lists/1/todos`
*   **Then** the API returns `401` with an unauthorized message

---

### US-4.6: Edit and remove steps

#### Scenario: Deleting a list removes its todos
*   **Given** I am signed in
*   **And** I own list `Groceries` with todos `Buy milk` and `Buy eggs`
*   **When** I delete list `Groceries` and confirm
*   **Then** both todos are removed from the database
*   **And** they no longer appear if the list ID were still queried

---

### US-4.7: recipes carry their steps

#### Scenario: Deleting a list removes its todos
*   **Given** I am signed in
*   **And** I own list `Groceries` with todos `Buy milk` and `Buy eggs`
*   **When** I delete list `Groceries` and confirm
*   **Then** both todos are removed from the database
*   **And** they no longer appear if the list ID were still queried

---

## Test Coverage Map



---

## Agent implementation request



---

## Definition of Done



---

## Out of Scope


