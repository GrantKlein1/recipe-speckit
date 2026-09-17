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


| Field         | Type         | Rules                                                       |
| ------------- | ------------ | ----------------------------------------------------------- |
| `id`          | INTEGER PK   | Auto-increment                                              |
| `recipeId`    | INTEGER FK   | Required; references `recipes.id`; cascade on recipe delete |
| `stepNumber`  | INTEGER      | Required                                                    |
| `instruction` | STRING(5000) | Required; max 5000 chars                                    |
| `createdAt`   | DATE         | Sequelize timestamps                                        |
| `updatedAt`   | DATE         | Sequelize timestamps                                        |




### `recipeIngredients` table


| Field          | Type       | Rules                                                                         |
| -------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`           | INTEGER PK | Auto-increment                                                                |
| `recipeId`     | INTEGER FK | Required; references `recipes.id`; cascade on recipe delete                   |
| `ingredientId` | INTEGER FK | Required; references `ingredients.id`                                         |
| `recipeStepId` | INTEGER FK | Optional; references `recipeSteps.id`; null if the line is not tied to a step |
| `quantity`     | FLOAT      | Required                                                                      |
| `createdAt`    | DATE       | Sequelize timestamps                                                          |
| `updatedAt`    | DATE       | Sequelize timestamps                                                          |


No `userId` on either table. Ownership is through the parent recipe (`recipes.userId`).

### Associations (add to `models/index.js`)

- `Recipe hasMany RecipeStep` — `onDelete: CASCADE`
- `RecipeStep belongsTo Recipe`
- `Recipe hasMany RecipeIngredient` — `onDelete: CASCADE`
- `RecipeIngredient belongsTo Recipe`
- `Ingredient hasMany RecipeIngredient`
- `RecipeIngredient belongsTo Ingredient`
- `RecipeStep hasMany RecipeIngredient`
- `RecipeIngredient belongsTo RecipeStep` — `recipeStepId` optional (`allowNull: true`)

---



## Acceptance Criteria (Gherkin)

### US-4.1 — Add ingredients to a recipe

#### Scenario: User adds an ingredient to a recipe via dialog

- **Given** I am signed in
- **And** I own recipe `Pancakes`
- **And** catalog ingredient `Flour` exists (unit `cup`, price per unit `1.50`)
- **When** I open Edit Recipe for `Pancakes`
- **And** I click **Add** in the Ingredients section
- **And** I enter quantity `2` and select `Flour`
- **And** I click **Add Ingredient**
- **Then** `POST /recipeapi/recipes/:recipeId/recipeIngredients/` returns `200` with `quantity` `2`, `ingredientId` matching `Flour`, and `recipeId` matching `Pancakes`
- **And** `recipeStepId` is `null`
- **And** the Ingredients section shows `2 cups of Flour`

#### Scenario: User cancels add an ingredient to a recipe

- **Given** I am signed in
- **And** I own recipe `Pancakes`
- **And** catalog ingredient `Flour` exists (unit `cup`, price per unit `1.50`)
- **When** I open Edit Recipe for `Pancakes`
- **And** I click **Add** in the Ingredients section
- **And** I enter quantity `2` and select `Flour`
- **And** I click **Close**
- **Then** I return to the Recipe Edit page
- **And** the Ingredients section does not show `2 cups of Flour`

#### Scenario: User adds a recipe ingredient with an empty quantity

- **Given** I am signed in on Edit Recipe for an owned recipe
- **And** I have opened the **Add Ingredient** dialog
- **And** I have selected catalog ingredient `Flour`
- **When** I leave **Quantity** empty
- **And** I click **Add Ingredient**
- **Then** inline validation blocks the request
- **And** no create API request is sent

#### Scenario: User adds a recipe ingredient without selecting a catalog ingredient

- **Given** I am signed in on Edit Recipe for an owned recipe
- **And** I have opened the **Add Ingredient** dialog
- **And** I have entered quantity `2`
- **When** I click **Add Ingredient** without selecting an ingredient
- **Then** inline validation blocks the request
- **And** no create API request is sent

#### Scenario: Missing quantity on create is rejected by the API

- **Given** I am signed in
- **And** I own recipe `Pancakes`
- **When** I send `POST /recipeapi/recipes/:recipeId/recipeIngredients/` without `quantity`
- **Then** the API returns `400` with `{ "message": "Quantity cannot be empty for recipe ingredient!" }`
- **And** no recipe ingredient is created

#### Scenario: Missing ingredientId on create is rejected by the API

- **Given** I am signed in
- **And** I own recipe `Pancakes`
- **When** I send `POST /recipeapi/recipes/:recipeId/recipeIngredients/` without `ingredientId`
- **Then** the API returns `400` with `{ "message": "Ingredient ID cannot be empty for recipe ingredient!" }`
- **And** no recipe ingredient is created

#### Scenario: Unknown catalog ingredientId is rejected

- **Given** I am signed in
- **And** I own recipe `Pancakes`
- **When** I send `POST /recipeapi/recipes/:recipeId/recipeIngredients/` with an `ingredientId` that does not exist
- **Then** the API returns `400` or `404`
- **And** no recipe ingredient is created
- **And** no new catalog ingredient is created

#### Scenario: Recipe ingredient is stored without a step when recipeStepId is omitted

- **Given** I am signed in
- **And** I own recipe `Pancakes`
- **When** I create a recipe ingredient without `recipeStepId`
- **Then** the saved row has `recipeStepId` `null`

#### Scenario: Add ingredient is only available on Edit Recipe

- **Given** I am signed in on the recipes list
- **And** the Edit Recipe screen is not open
- **When** I view the recipes list
- **Then** I do not see an **Add Ingredient** control or add-ingredient dialog on the recipes list

#### Scenario: User cannot add an ingredient to another user's recipe

- **Given** I am signed in as user A
- **And** user B owns recipe `Secret Cake`
- **When** I send `POST /recipeapi/recipes/:recipeId/recipeIngredients/` with user B's recipe ID
- **Then** the API returns `404` with `{ "message": "Cannot find Recipe with id=<id>." }`
- **And** no recipe ingredient is created on user B's recipe

#### Scenario: Client cannot assign a recipe ingredient to another user on create

- **Given** I am signed in as user A
- **And** I own recipe `Pancakes`
- **When** I send `POST /recipeapi/recipes/:recipeId/recipeIngredients/` with a body that includes `"userId": 999`
- **Then** the API returns `200` with a recipe ingredient on my recipe `Pancakes`
- **And** ownership remains user A's via the parent recipe (no `userId` stored on the recipe ingredient)

#### Scenario: Unauthenticated create of a recipe ingredient returns 401

- **Given** I have no valid session token
- **When** I send `POST /recipeapi/recipes/1/recipeIngredients/`
- **Then** the API returns `401`

---

### US-4.2 — Add steps to a recipe

#### Scenario: User adds a step to a recipe via dialog

- **Given** I am signed in
- **And** I own recipe `Pancakes`
- **When** I open Edit Recipe for `Pancakes`
- **And** I click **Add** in the Steps section
- **And** I enter number `1` and instruction `Mix the batter`
- **And** I click **Add Step**
- **Then** `POST /recipeapi/recipes/:recipeId/recipeSteps/` returns `200` with `stepNumber` `1`, `instruction` `Mix the batter`, and `recipeId` matching `Pancakes`
- **And** the Steps section shows `Mix the batter`

#### Scenario: User adds a step linked to existing recipe ingredients

- **Given** I am signed in on Edit Recipe for `Pancakes`
- **And** `Pancakes` already has recipe ingredient `Flour`
- **When** I add a step with instruction `Mix the batter` and select `Flour` in the step's **Ingredients** field
- **And** I click **Add Step**
- **Then** the step is created
- **And** the `Flour` recipe ingredient has `recipeStepId` set to that step
- **And** the Steps section shows `Flour` on that step

#### Scenario: User adds a recipe step with an empty instruction

- **Given** I am signed in on Edit Recipe for an owned recipe
- **And** I have opened the **Add Step** dialog
- **And** I have entered number `1`
- **When** I leave **Instruction** empty
- **And** I click **Add Step**
- **Then** inline validation blocks the request
- **And** no create API request is sent

#### Scenario: Missing stepNumber or instruction on create is rejected by the API

- **Given** I am signed in
- **And** I own recipe `Pancakes`
- **When** I send `POST /recipeapi/recipes/:recipeId/recipeSteps/` without `stepNumber` or without `instruction`
- **Then** the API returns `400`
- **And** no recipe step is created

#### Scenario: Instruction longer than 5000 characters is rejected

- **Given** I am signed in
- **And** I own recipe `Pancakes`
- **When** I send `POST /recipeapi/recipes/:recipeId/recipeSteps/` with `instruction` longer than 5000 characters
- **Then** the API returns `400`
- **And** no recipe step is created

#### Scenario: Add step is only available on Edit Recipe

- **Given** I am signed in on the recipes list
- **And** the Edit Recipe screen is not open
- **When** I view the recipes list
- **Then** I do not see an **Add Step** control or add-step dialog on the recipes list

#### Scenario: User cannot add a step to another user's recipe

- **Given** I am signed in as user A
- **And** user B owns recipe `Secret Cake`
- **When** I send `POST /recipeapi/recipes/:recipeId/recipeSteps/` with user B's recipe ID
- **Then** the API returns `404`
- **And** no recipe step is created on user B's recipe

#### Scenario: Unauthenticated create of a recipe step returns 401

- **Given** I have no valid session token
- **When** I send `POST /recipeapi/recipes/1/recipeSteps/`
- **Then** the API returns `401`

---

### US-4.3 — View ingredients in a recipe

#### Scenario: Ingredients section shows an empty recipe

- **Given** I am signed in
- **And** I own recipe `Pancakes` with no recipe ingredients
- **When** I open Edit Recipe for `Pancakes`
- **Then** I see the **Ingredients** section
- **And** I do not see any catalog ingredient names in that section

#### Scenario: User opens ingredients for different recipes

- **Given** I am signed in
- **And** my recipe `Pancakes` has recipe ingredient `Flour`
- **And** my recipe `Omelette` has recipe ingredient `Eggs`
- **When** I open Edit Recipe for `Omelette`
- **Then** I see `Eggs` and I do not see `Flour`
- **When** I open Edit Recipe for `Pancakes`
- **Then** I see `Flour` and I do not see `Eggs`

#### Scenario: Ingredient listing includes catalog name, unit, and price

- **Given** I am signed in on Edit Recipe for `Pancakes`
- **And** `Pancakes` has `2` cups of `Flour` at `1.50` per cup
- **When** the ingredients finish loading
- **Then** I see quantity `2`, unit `cup`, name `Flour`, and price per unit `1.50`

#### Scenario: User only sees their own recipe ingredients

- **Given** I am signed in as user A
- **And** I own recipe `Pancakes` with recipe ingredient `Flour`
- **And** user B owns a recipe with recipe ingredient `Sugar`
- **When** I open Edit Recipe for my `Pancakes` recipe
- **Then** I see `Flour`
- **And** I do not see `Sugar`

---

### US-4.4 — View steps in a recipe

#### Scenario: Steps section shows an empty recipe

- **Given** I am signed in
- **And** I own recipe `Pancakes` with no recipe steps
- **When** I open Edit Recipe for `Pancakes`
- **Then** I see the **Steps** section
- **And** I do not see step instructions in that section

#### Scenario: User opens steps for different recipes

- **Given** I am signed in
- **And** my recipe `Pancakes` has step `Mix the batter`
- **And** my recipe `Omelette` has step `Whisk the eggs`
- **When** I open Edit Recipe for `Omelette`
- **Then** I see `Whisk the eggs` and I do not see `Mix the batter`
- **When** I open Edit Recipe for `Pancakes`
- **Then** I see `Mix the batter` and I do not see `Whisk the eggs`

#### Scenario: Recipe steps are listed by step number ascending

- **Given** I am signed in on Edit Recipe for `Pancakes`
- **And** `Pancakes` has steps `1 Mix the batter`, `2 Heat the pan`, and `3 Plate it`
- **When** the steps finish loading
- **Then** I see them in order `1`, `2`, `3`

#### Scenario: Step listing includes linked recipe ingredients

- **Given** I am signed in on Edit Recipe for `Pancakes`
- **And** step `Mix the batter` is linked to recipe ingredient `Flour`
- **When** the steps finish loading
- **Then** that step row shows `Flour`

---

### US-4.5 — Edit and remove ingredients

#### Scenario: User edits a recipe ingredient quantity

- **Given** I am signed in on Edit Recipe for `Pancakes`
- **And** `Pancakes` has `2 cups of Flour`
- **When** I click the edit icon on that ingredient
- **And** I change **Quantity** to `3`
- **And** I click **Update Ingredient**
- **Then** `PUT /recipeapi/recipes/:recipeId/recipeIngredients/:id` returns `200`
- **And** the Ingredients section shows `3 cups of Flour`

#### Scenario: User changes a recipe ingredient's catalog ingredient

- **Given** I am signed in on Edit Recipe for `Pancakes`
- **And** `Pancakes` has recipe ingredient `Flour`
- **And** catalog ingredient `Milk` exists
- **When** I edit that line and select `Milk`
- **And** I click **Update Ingredient**
- **Then** the saved `ingredientId` matches `Milk`
- **And** the Ingredients section shows `Milk` instead of `Flour`

#### Scenario: User deletes a recipe ingredient

- **Given** I am signed in on Edit Recipe for `Pancakes`
- **And** `Pancakes` has recipe ingredient `Flour`
- **When** I click the delete icon on that ingredient
- **Then** `DELETE /recipeapi/recipes/:recipeId/recipeIngredients/:id` returns `200`
- **And** `Flour` is no longer shown in the Ingredients section

#### Scenario: Catalog ingredient remains after deleting a recipe line

- **Given** I am signed in
- **And** catalog ingredient `Flour` exists
- **And** my recipe has a recipe ingredient that references `Flour`
- **When** I delete that recipe ingredient
- **Then** catalog ingredient `Flour` still exists

#### Scenario: User cannot update another user's recipe ingredient

- **Given** I am signed in as user A
- **And** a recipe ingredient exists on user B's recipe
- **When** I send `PUT /recipeapi/recipes/:recipeId/recipeIngredients/:id` for that row
- **Then** the API returns `404`
- **And** user B's recipe ingredient is unchanged

#### Scenario: User cannot delete another user's recipe ingredient

- **Given** I am signed in as user A
- **And** a recipe ingredient exists on user B's recipe
- **When** I send `DELETE /recipeapi/recipes/:recipeId/recipeIngredients/:id` for that row
- **Then** the API returns `404`
- **And** user B's recipe ingredient still exists

#### Scenario: Unauthenticated update or delete of a recipe ingredient returns 401

- **Given** I have no valid session token
- **When** I send `PUT` or `DELETE` for a recipe ingredient
- **Then** the API returns `401`

---

### US-4.6 — Edit and remove steps

#### Scenario: User edits a recipe step

- **Given** I am signed in on Edit Recipe for `Pancakes`
- **And** `Pancakes` has step `Mix the batter`
- **When** I click the edit icon on that step
- **And** I change **Instruction** to `Whisk the batter`
- **And** I click **Update Step**
- **Then** `PUT /recipeapi/recipes/:recipeId/recipeSteps/:id` returns `200`
- **And** the Steps section shows `Whisk the batter`

#### Scenario: User updates which ingredients are linked to a step

- **Given** I am signed in on Edit Recipe for `Pancakes`
- **And** step `Mix the batter` is linked to `Flour`
- **And** `Pancakes` also has unlinked recipe ingredient `Milk`
- **When** I edit that step, select only `Milk`, and click **Update Step**
- **Then** `Milk` has `recipeStepId` set to that step
- **And** the Steps section shows `Milk` on that step

#### Scenario: User deletes a recipe step

- **Given** I am signed in on Edit Recipe for `Pancakes`
- **And** `Pancakes` has step `Mix the batter`
- **When** I click the delete icon on that step
- **Then** `DELETE /recipeapi/recipes/:recipeId/recipeSteps/:id` returns `200`
- **And** `Mix the batter` is no longer shown in the Steps section

#### Scenario: User cannot update another user's recipe step

- **Given** I am signed in as user A
- **And** a recipe step exists on user B's recipe
- **When** I send `PUT /recipeapi/recipes/:recipeId/recipeSteps/:id` for that step
- **Then** the API returns `404`
- **And** user B's step is unchanged

#### Scenario: User cannot delete another user's recipe step

- **Given** I am signed in as user A
- **And** a recipe step exists on user B's recipe
- **When** I send `DELETE /recipeapi/recipes/:recipeId/recipeSteps/:id` for that step
- **Then** the API returns `404`
- **And** user B's step still exists

#### Scenario: Unauthenticated update or delete of a recipe step returns 401

- **Given** I have no valid session token
- **When** I send `PUT` or `DELETE` for a recipe step
- **Then** the API returns `401`

---

### US-4.7 — recipes carry their steps

#### Scenario: Deleting a recipe removes its steps and recipe ingredients

- **Given** I am signed in
- **And** I own recipe `Pancakes` with step `Mix the batter` and recipe ingredient `Flour`
- **When** I delete recipe `Pancakes` and confirm
- **Then** that step and that recipe ingredient are removed from the database
- **And** catalog ingredient `Flour` still exists

---



## Test Coverage Map

---



## Agent implementation request

---



## Definition of Done

---



## Out of Scope

