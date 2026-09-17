# Feature: Recipe Ingredients and Steps Management

**Feature ID:** 4
**Branch pattern:** `feature/4-recipe-ingredients-management`
**Status:** Ready
**Created:** 2026-09-10
**Input:** Signed-in users manage recipe ingredients and steps per recipe via dialogs opened from ingredient rows (ingredients, add, edit, delete)
**Depends on:** [Feature 1 — Account Management](feature-1-account-management.md), [Feature 2 — Ingredients Management](feature-2-ingredients-management.md), [Feature 3 — Recipe Management](feature-3-recipe-management.md)
**Related:** `features/reference/api.md`, `features/reference/data-model.md`, `features/reference/behavior.md`

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

Each user owns their **recipes** (Feature 3). Recipe ingredients and recipe steps have **no `userId`**. Read and write scope always go through the parent recipe (`recipes.userId`).


| Rule                  | Requirement                                                                                                                                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Read scope**        | List calls return only rows for the `recipeId` in the path (FR-011, FR-012). Nested catalog `ingredient` is included on recipe-ingredient lists.                                                            |
| **Write scope**       | Create, update, and delete succeed only when the parent recipe exists and `recipe.userId = req.user.id` (FR-003, FR-004).                                                                                   |
| **Create scope**      | New rows belong to that owned `recipeId`. Ignore any client-supplied `userId` (FR-005). If `recipeStepId` is omitted, store `null` (FR-008).                                                                |
| **Cross-user access** | Another user’s recipe, or a recipe ingredient/step on it → `404` (not `403`). Create onto another user’s recipe: `{ "message": "Cannot find Recipe with id=<id>." }`                                        |
| **UI scope**          | Add / edit / delete only on **Edit Recipe** for an owned recipe (FR-020). The recipes list MUST NOT show **Add Ingredient** or **Add Step** dialogs. The UI only renders lists returned for the open recipe. |
| **Implementation**    | Writes use `authenticateRoute`. Parent-recipe check: load `Recipe` by id and compare `userId` to `req.user.id` (same pattern as `recipeIngredient.controller.js` create). Do not add `userId` columns. Do not invent `app/authorization/` — this app uses `app/authentication/`. |


---



## Key Entities

- **RecipeIngredient**: a quantity of a catalog ingredient used on one recipe; optionally linked to one recipe step.
- **RecipeStep**: a numbered instruction on one recipe; may reference that recipe’s ingredients.
- **Recipe**: parent container for steps and recipe ingredients (Feature 3); deleting a recipe removes its steps and recipe ingredients.
- **Ingredient**: shared catalog item with name, unit, and price (Feature 2); recipe ingredients reference it and MUST NOT delete it when a recipe line is removed.
- **User**: account that owns recipes (Feature 1); ownership of steps and recipe ingredients is through the parent recipe.

---



## API Requirements

Mount prefix: `/recipeapi` (see `backend/server.js`). Flat JSON; errors `{ "message": "…" }`. Do not wrap in `{ success, data }`. Create success is **`200`** (Gherkin and running `res.send`). Not found / not owned: `404` (do not use `403`). Unauthenticated writes: `401`.

This feature’s contract is the nested recipe-ingredient and recipe-step routes the Edit Recipe screen and Gherkin use. Catalog ingredients stay [Feature 2](./feature-2-ingredients-management.md). Recipe row CRUD stays [Feature 3](./feature-3-recipe-management.md) except cascade-on-delete (FR-019).


| Method   | Endpoint                                                     | Auth   | Purpose                                                                                          |
| -------- | ------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------ |
| `POST`   | `/recipeapi/recipes/:recipeId/recipeIngredients/`            | Bearer | Create a recipe ingredient (FR-006–FR-008)                                                       |
| `GET`    | `/recipeapi/recipes/:recipeId/recipeIngredients/`            | No     | List that recipe’s ingredients with catalog `name`, `unit`, `pricePerUnit` (FR-011)              |
| `PUT`    | `/recipeapi/recipes/:recipeId/recipeIngredients/:id`         | Bearer | Update `quantity`, `ingredientId`, and/or `recipeStepId` (FR-014, FR-018)                        |
| `DELETE` | `/recipeapi/recipes/:recipeId/recipeIngredients/:id`         | Bearer | Remove the recipe line; do not delete the catalog ingredient (FR-015)                            |
| `POST`   | `/recipeapi/recipes/:recipeId/recipeSteps/`                  | Bearer | Create a recipe step (FR-009, FR-010)                                                            |
| `GET`    | `/recipeapi/recipes/:recipeId/recipeSteps/`                  | No     | List that recipe’s steps ordered by `stepNumber` ascending (FR-012)                              |
| `GET`    | `/recipeapi/recipes/:recipeId/recipeStepsWithIngredients/`   | No     | Same list, including linked recipe ingredients (FR-013). Edit Recipe and recipe cards use this. |
| `PUT`    | `/recipeapi/recipes/:recipeId/recipeSteps/:id`               | Bearer | Update `stepNumber` and `instruction` (FR-016)                                                   |
| `DELETE` | `/recipeapi/recipes/:recipeId/recipeSteps/:id`               | Bearer | Delete the step (FR-017)                                                                         |


List `GET`s are unauthenticated in the running app so recipe cards can show ingredients/steps to guests on published recipes. Writes still require a session (FR-001).

The running frontend sends `recipeId` in the JSON body as well as the path; create handlers require it.

Linking a step to existing recipe ingredients is **not** a field on `POST` step. After the step is created (or on update), the UI `PUT`s each selected recipe ingredient with `recipeStepId` set to that step (FR-018).

### Create recipe ingredient — `POST /recipeapi/recipes/:recipeId/recipeIngredients/`

**Request body:**

```json
{
  "quantity": 2,
  "ingredientId": 1,
  "recipeId": 1,
  "recipeStepId": null
}
```

`recipeStepId` may be omitted; store `null`.

**Success (`200`):**

```json
{
  "id": 10,
  "quantity": 2,
  "ingredientId": 1,
  "recipeId": 1,
  "recipeStepId": null
}
```

**Errors:**


| Status | Condition                                      | `message`                                              |
| ------ | ---------------------------------------------- | ------------------------------------------------------ |
| `400`  | Missing `quantity`                             | `Quantity cannot be empty for recipe ingredient!`      |
| `400`  | Missing `ingredientId`                         | `Ingredient ID cannot be empty for recipe ingredient!` |
| `400` or `404` | `ingredientId` not in the catalog        | (no new catalog ingredient is created)                 |
| `404`  | Parent recipe missing or not owned             | `Cannot find Recipe with id=<id>.`                     |
| `401`  | Missing/invalid Bearer token                   |                                                        |


A body `"userId": 999` is ignored; ownership stays on the parent recipe (FR-005).

### List recipe ingredients — `GET /recipeapi/recipes/:recipeId/recipeIngredients/`

**Success (`200`):** array of recipe-ingredient rows, each including nested catalog `ingredient`:

```json
[
  {
    "id": 10,
    "quantity": 2,
    "recipeId": 1,
    "ingredientId": 1,
    "recipeStepId": null,
    "ingredient": {
      "id": 1,
      "name": "Flour",
      "unit": "cup",
      "pricePerUnit": "1.50"
    }
  }
]
```

### Update recipe ingredient — `PUT /recipeapi/recipes/:recipeId/recipeIngredients/:id`

**Request body (running Edit Recipe):** `quantity`, `ingredientId`, `recipeId`, `recipeStepId` as needed.

**Success (`200`):** `{ "message": "RecipeIngredient was updated successfully." }`

**Errors:** not owned / missing parent recipe → `404`. Unauthenticated → `401`.

### Delete recipe ingredient — `DELETE /recipeapi/recipes/:recipeId/recipeIngredients/:id`

**Success (`200`):** `{ "message": "RecipeIngredient was deleted successfully!" }`

Catalog ingredient row MUST remain (FR-015). Not owned → `404`. Unauthenticated → `401`.

### Create recipe step — `POST /recipeapi/recipes/:recipeId/recipeSteps/`

**Request body:**

```json
{
  "stepNumber": 1,
  "instruction": "Mix the batter",
  "recipeId": 1
}
```

**Success (`200`):**

```json
{
  "id": 20,
  "stepNumber": 1,
  "instruction": "Mix the batter",
  "recipeId": 1
}
```

**Errors:**


| Status | Condition                                      | `message`                                          |
| ------ | ---------------------------------------------- | -------------------------------------------------- |
| `400`  | Missing `stepNumber`                           | `Step number cannot be empty for recipe step!`     |
| `400`  | Missing `instruction`                          | `Description cannot be empty for recipe step!`     |
| `400`  | `instruction` longer than 5000 characters      |                                                    |
| `404`  | Parent recipe missing or not owned             |                                                    |
| `401`  | Missing/invalid Bearer token                   |                                                    |


### List recipe steps — `GET /recipeapi/recipes/:recipeId/recipeSteps/` and `…/recipeStepsWithIngredients/`

Both return that recipe’s steps ordered by `stepNumber` **ASC** (FR-012). The `recipeStepsWithIngredients` variant nests linked lines under `recipeIngredient` (association alias in the running models), each with catalog `ingredient` (FR-013).

**Success (`200`) example (`recipeStepsWithIngredients`):**

```json
[
  {
    "id": 20,
    "stepNumber": 1,
    "instruction": "Mix the batter",
    "recipeId": 1,
    "recipeIngredient": [
      {
        "id": 10,
        "quantity": 2,
        "ingredientId": 1,
        "recipeStepId": 20,
        "ingredient": {
          "id": 1,
          "name": "Flour",
          "unit": "cup",
          "pricePerUnit": "1.50"
        }
      }
    ]
  }
]
```

### Update recipe step — `PUT /recipeapi/recipes/:recipeId/recipeSteps/:id`

**Request body:** `stepNumber`, `instruction` (and `recipeId` as the running client sends).

**Success (`200`):** `{ "message": "RecipeStep was updated successfully." }`

Changing which recipe ingredients belong to the step is done with recipe-ingredient `PUT`s (`recipeStepId`), not a nested create payload (FR-016, FR-018).

Not owned → `404`. Unauthenticated → `401`.

### Delete recipe step — `DELETE /recipeapi/recipes/:recipeId/recipeSteps/:id`

**Success (`200`):** `{ "message": "RecipeStep was deleted successfully!" }`

Not owned → `404`. Unauthenticated → `401`.

### Cascade (FR-019 / US-4.7)

`DELETE /recipeapi/recipes/:id` is Feature 3. After a recipe is deleted, its `recipeSteps` and `recipeIngredients` MUST be gone; catalog `ingredients` remain. Associations: `onDelete: CASCADE` on the recipe parent.

---



## Screen Requirements

Follow [ui-style-system.mdc](../.cursor/rules/ui-style-system.mdc) for theme tokens. Labels below match Gherkin and the running Edit Recipe UI (`frontend/src/views/EditRecipe.vue`).

### [View: Edit Recipe] — route name `editRecipe` (`/recipe/:id`)

Feature 1 requires a session; otherwise redirect to `login`. Recipe name / servings / time / description / **Update Recipe** / publish switch are Feature 3 (and Feature 5 for publish). This feature owns the **Ingredients** and **Steps** sections and their dialogs (FR-020).

**Ingredients section**

- Section title: **Ingredients**
- Primary action: **Add** (opens the add-ingredient dialog)
- Each line shows `{quantity} {unit}(s) of {name}` — e.g. **`2 cups of Flour`** — plus catalog price `($1.50/cup)` from FR-011
- Row actions: pencil icon (edit), trash icon (delete). No confirm step on delete (Gherkin)
- **Empty:** the section is visible; no catalog ingredient names appear
- **Loading:** fetch `GET …/recipes/:id/recipeIngredients/` on mount (with the recipe and catalog ingredients)
- **Error:** snackbar with the API `message`

**Add Ingredient / Edit Ingredient dialog** (`v-dialog`)

- Titles: **Add Ingredient** / **Edit Ingredient**
- Fields: **Quantity** (number, required), **Ingredients** (select of Feature 2 catalog; `item-title` `name`, return object)
- Confirm: **Add Ingredient** or **Update Ingredient**
- Dismiss: **Close** — returns to Edit Recipe with no create/update request
- Empty **Quantity** or no catalog selection → inline validation; no create API request
- Add posts `quantity`, `ingredientId`, `recipeId`; `recipeStepId` omitted → `null`
- Edit may change **Quantity** and the selected catalog ingredient (FR-014)

**Steps section**

- Section title: **Steps**
- Primary action: **Add** (opens the add-step dialog)
- Table rows: `stepNumber`, `instruction`, chips of linked catalog names (e.g. **Flour**), pencil, trash
- Order is `stepNumber` ascending (FR-012)
- **Empty:** the section is visible; no step instructions appear
- **Loading:** fetch `GET …/recipes/:id/recipeStepsWithIngredients/` on mount
- **Error:** snackbar with the API `message`

**Add Step / Edit Step dialog** (`v-dialog`)

- Titles: **Add Step** / **Edit Step**
- Fields: **Number** (`stepNumber`, required), **Instruction** (required, max 5000), **Ingredients** (multi-select of **this recipe’s existing** recipe ingredients; may be empty — FR-018)
- Confirm: **Add Step** or **Update Step**
- Dismiss: **Close** — returns to Edit Recipe with no create/update request
- Empty **Instruction** (and missing required create fields) → inline validation; no create API request
- After the step is saved, selected recipe ingredients are `PUT` with `recipeStepId` set to that step

### [View: Recipe list] — route name `recipes` (`/recipes`)

- No **Add Ingredient**, **Add Step**, or those dialogs on this view (FR-020)
- Signed-in pencil on a card navigates to `editRecipe` (Feature 3 chrome)
- Expanding a card may show read-only ingredients and steps via the list `GET`s (`RecipeCardComponent`); that is display only — no add/edit/delete of lines

### App chrome

- Unchanged in this feature (`MenuBar` from Features 1–2)

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

#### Scenario: User closes add an ingredient to a recipe

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

#### Scenario: User closes add a step to a recipe via dialog

- **Given** I am signed in
- **And** I own recipe `Pancakes`
- **When** I open Edit Recipe for `Pancakes`
- **And** I click **Add** in the Steps section
- **And** I enter number `1` and instruction `Mix the batter`
- **And** I click **Close**
- **Then** I return to the Recipe Edit page
- **And** the Steps section does not show `Mix the batter`

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

Each scenario above must map to at least one automated test.


| Story  | Scenario                                                                 | Test file                                  | Test name                                                                              |
| ------ | ------------------------------------------------------------------------ | ------------------------------------------ | -------------------------------------------------------------------------------------- |
| US-4.1 | User adds an ingredient to a recipe via dialog                           | `frontend/tests/EditRecipe.test.js`        | `it("User adds an ingredient to a recipe via dialog")`                                 |
| US-4.1 | User closes add an ingredient to a recipe                               | `frontend/tests/EditRecipe.test.js`        | `it("User closes add an ingredient to a recipe")`                                     |
| US-4.1 | User adds a recipe ingredient with an empty quantity                     | `frontend/tests/EditRecipe.test.js`        | `it("User adds a recipe ingredient with an empty quantity")`                           |
| US-4.1 | User adds a recipe ingredient without selecting a catalog ingredient     | `frontend/tests/EditRecipe.test.js`        | `it("User adds a recipe ingredient without selecting a catalog ingredient")`           |
| US-4.1 | Missing quantity on create is rejected by the API                        | `backend/tests/recipe-ingredients.test.js` | `it("Missing quantity on create is rejected by the API")`                              |
| US-4.1 | Missing ingredientId on create is rejected by the API                    | `backend/tests/recipe-ingredients.test.js` | `it("Missing ingredientId on create is rejected by the API")`                          |
| US-4.1 | Unknown catalog ingredientId is rejected                                 | `backend/tests/recipe-ingredients.test.js` | `it("Unknown catalog ingredientId is rejected")`                                       |
| US-4.1 | Recipe ingredient is stored without a step when recipeStepId is omitted  | `backend/tests/recipe-ingredients.test.js` | `it("Recipe ingredient is stored without a step when recipeStepId is omitted")`        |
| US-4.1 | Add ingredient is only available on Edit Recipe                          | `frontend/tests/RecipeList.test.js`        | `it("Add ingredient is only available on Edit Recipe")`                                |
| US-4.1 | User cannot add an ingredient to another user's recipe                   | `backend/tests/recipe-ingredients.test.js` | `it("User cannot add an ingredient to another user's recipe")`                         |
| US-4.1 | Client cannot assign a recipe ingredient to another user on create       | `backend/tests/recipe-ingredients.test.js` | `it("Client cannot assign a recipe ingredient to another user on create")`             |
| US-4.1 | Unauthenticated create of a recipe ingredient returns 401                | `backend/tests/recipe-ingredients.test.js` | `it("Unauthenticated create of a recipe ingredient returns 401")`                      |
| US-4.2 | User adds a step to a recipe via dialog                                  | `frontend/tests/EditRecipe.test.js`        | `it("User adds a step to a recipe via dialog")`                                        |
| US-4.2 | User closes add a step to a recipe via dialog                            | `frontend/tests/EditRecipe.test.js`        | `it("User closes add a step to a recipe via dialog")`                                  |
| US-4.2 | User adds a step linked to existing recipe ingredients                   | `frontend/tests/EditRecipe.test.js`        | `it("User adds a step linked to existing recipe ingredients")`                         |
| US-4.2 | User adds a recipe step with an empty instruction                        | `frontend/tests/EditRecipe.test.js`        | `it("User adds a recipe step with an empty instruction")`                              |
| US-4.2 | Missing stepNumber or instruction on create is rejected by the API       | `backend/tests/recipe-steps.test.js`       | `it("Missing stepNumber or instruction on create is rejected by the API")`             |
| US-4.2 | Instruction longer than 5000 characters is rejected                      | `backend/tests/recipe-steps.test.js`       | `it("Instruction longer than 5000 characters is rejected")`                            |
| US-4.2 | Add step is only available on Edit Recipe                                | `frontend/tests/RecipeList.test.js`        | `it("Add step is only available on Edit Recipe")`                                      |
| US-4.2 | User cannot add a step to another user's recipe                          | `backend/tests/recipe-steps.test.js`       | `it("User cannot add a step to another user's recipe")`                                |
| US-4.2 | Unauthenticated create of a recipe step returns 401                      | `backend/tests/recipe-steps.test.js`       | `it("Unauthenticated create of a recipe step returns 401")`                            |
| US-4.3 | Ingredients section shows an empty recipe                                | `frontend/tests/EditRecipe.test.js`        | `it("Ingredients section shows an empty recipe")`                                      |
| US-4.3 | User opens ingredients for different recipes                             | `frontend/tests/EditRecipe.test.js`        | `it("User opens ingredients for different recipes")`                                   |
| US-4.3 | Ingredient listing includes catalog name, unit, and price                | `frontend/tests/EditRecipe.test.js`        | `it("Ingredient listing includes catalog name, unit, and price")`                      |
| US-4.3 | User only sees their own recipe ingredients                              | `frontend/tests/EditRecipe.test.js`        | `it("User only sees their own recipe ingredients")`                                    |
| US-4.4 | Steps section shows an empty recipe                                      | `frontend/tests/EditRecipe.test.js`        | `it("Steps section shows an empty recipe")`                                            |
| US-4.4 | User opens steps for different recipes                                   | `frontend/tests/EditRecipe.test.js`        | `it("User opens steps for different recipes")`                                         |
| US-4.4 | Recipe steps are listed by step number ascending                         | `frontend/tests/EditRecipe.test.js`        | `it("Recipe steps are listed by step number ascending")`                               |
| US-4.4 | Step listing includes linked recipe ingredients                          | `frontend/tests/EditRecipe.test.js`        | `it("Step listing includes linked recipe ingredients")`                                |
| US-4.5 | User edits a recipe ingredient quantity                                  | `frontend/tests/EditRecipe.test.js`        | `it("User edits a recipe ingredient quantity")`                                        |
| US-4.5 | User changes a recipe ingredient's catalog ingredient                    | `frontend/tests/EditRecipe.test.js`        | `it("User changes a recipe ingredient's catalog ingredient")`                          |
| US-4.5 | User deletes a recipe ingredient                                         | `frontend/tests/EditRecipe.test.js`        | `it("User deletes a recipe ingredient")`                                               |
| US-4.5 | Catalog ingredient remains after deleting a recipe line                  | `backend/tests/recipe-ingredients.test.js` | `it("Catalog ingredient remains after deleting a recipe line")`                        |
| US-4.5 | User cannot update another user's recipe ingredient                      | `backend/tests/recipe-ingredients.test.js` | `it("User cannot update another user's recipe ingredient")`                            |
| US-4.5 | User cannot delete another user's recipe ingredient                      | `backend/tests/recipe-ingredients.test.js` | `it("User cannot delete another user's recipe ingredient")`                            |
| US-4.5 | Unauthenticated update or delete of a recipe ingredient returns 401      | `backend/tests/recipe-ingredients.test.js` | `it("Unauthenticated update or delete of a recipe ingredient returns 401")`            |
| US-4.6 | User edits a recipe step                                                 | `frontend/tests/EditRecipe.test.js`        | `it("User edits a recipe step")`                                                       |
| US-4.6 | User updates which ingredients are linked to a step                      | `frontend/tests/EditRecipe.test.js`        | `it("User updates which ingredients are linked to a step")`                            |
| US-4.6 | User deletes a recipe step                                               | `frontend/tests/EditRecipe.test.js`        | `it("User deletes a recipe step")`                                                     |
| US-4.6 | User cannot update another user's recipe step                            | `backend/tests/recipe-steps.test.js`       | `it("User cannot update another user's recipe step")`                                  |
| US-4.6 | User cannot delete another user's recipe step                            | `backend/tests/recipe-steps.test.js`       | `it("User cannot delete another user's recipe step")`                                  |
| US-4.6 | Unauthenticated update or delete of a recipe step returns 401            | `backend/tests/recipe-steps.test.js`       | `it("Unauthenticated update or delete of a recipe step returns 401")`                  |
| US-4.7 | Deleting a recipe removes its steps and recipe ingredients               | `backend/tests/recipe-ingredients.test.js` | `it("Deleting a recipe removes its steps and recipe ingredients")`                     |


Create/update HTTP `200` bodies for dialog scenarios are asserted from the matching `it` in `EditRecipe.test.js`; ownership and `400`/`401`/`404` contracts belong in the backend files above (those files are the intended Jest paths — add them when implementing).

---



## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 4 from @features/feature-4-recipe-ingredients-management.md on branch `feature/4-recipe-ingredients-management`.

Follow layer order in @features/framework.md (models → routes → backend tests → frontend → frontend tests).
Map every Gherkin scenario in the Test Coverage Map; run `npm test` before finishing.
If API routes, payloads, schema, or product rules changed per this spec, update @features/reference/api.md, @features/reference/data-model.md, and/or @features/reference/behavior.md in the same PR to match shipped code.
Complete Definition of Done and the merge checklist in @features/framework.md.
Do not implement behavior not in this spec.
```

**Reference updates for this feature:** `features/reference/api.md`, `features/reference/data-model.md`, `features/reference/behavior.md`

---



## Definition of Done

*   [ ] Backend and frontend implemented per this spec (**FR-001**–**FR-020** satisfied)
*   [ ] **Success Criteria (SC-001**–**SC-004)** met
*   [ ] All mapped tests pass (`npm test`)
*   [ ] Test Coverage Map complete
*   [ ] `features/reference/data-model.md` updated (if schema changed)
*   [ ] `features/reference/api.md` updated (if API changed)
*   [ ] `features/reference/behavior.md` updated (if product rules changed)

---



## Out of Scope

*   Catalog ingredient create/edit/delete ([Feature 2](./feature-2-ingredients-management.md)) — this flow only **selects** existing catalog rows (FR-007)
*   Recipe create / edit / delete UI and `DELETE /recipeapi/recipes/:id` contract except cascade of child rows ([Feature 3](./feature-3-recipe-management.md))
*   Published-recipe management and guest discovery beyond read-only card lists ([Feature 5](./feature-5-published-recipe-management.md))
*   Drag-and-drop reorder, search, and sharing
*   Unscoped leftover routes that are not in this feature’s Gherkin: `GET /recipeapi/recipeIngredients/`, `GET /recipeapi/recipeSteps/`, `DELETE /recipeapi/recipeIngredients/`, `DELETE /recipeapi/recipeSteps/`

