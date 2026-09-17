# Feature: Published Recipe Management

**Feature ID:** 5
**Branch pattern:** `features/feature-5-published-recipe-management` **Status:** Ready
**Created:** 2026-09-10
**Input:** Owners publish or unpublish recipes with a toggle on create/edit; anyone can open published recipes from the login screen without signing in
**Depends on:** [feature-1-account-management](feature-1-account-management.md), [feature-3-recipe-management](feature-3-recipe-management.md), [feature-4-recipe-ingredients-management](feature-4-recipe-ingredients-management.md) 

---

## User Stories

### US-5.1: Publish or unpublish from edit recipe

**As a** signed-in recipe owner  
**I want to** toggle **Publish?** on the edit recipe screen and save  
**So that** I can make my recipe visible to everyone or keep it private

**Priority:** P1  
**Independent test:** Open edit recipe, flip the publish switch, click **Update Recipe**; `isPublished` persists and public list reflects the change  
**Acceptance scenarios:** see ### US-5.1 under Acceptance Criteria

### US-5.2: Choose publish when creating a recipe

**As a** signed-in user  
**I want to** set **Publish?** when adding a new recipe  
**So that** I can share a recipe immediately without a separate edit step

**Priority:** P2  
**Independent test:** Add Recipe dialog includes the publish switch; created recipe stores the chosen `isPublished` value  
**Acceptance scenarios:** see ### US-5.2 under Acceptance Criteria

### US-5.3: View published recipes from login

**As a** visitor (not signed in)  
**I want to** click **View Published Recipes** on the login screen  
**So that** I can browse shared recipes without creating an account

**Priority:** P1  
**Independent test:** From login, click the button; recipes route loads published recipes only (no Add / edit affordances)  
**Acceptance scenarios:** see ### US-5.3 under Acceptance Criteria

### US-5.4: Browse published recipe details

**As a** visitor viewing published recipes  
**I want to** expand a recipe card to see description, servings, time, ingredients, and steps  
**So that** I can follow a shared recipe

**Priority:** P1  
**Independent test:** Guest recipes view shows published cards; expanding a card reveals ingredients and steps  
**Acceptance scenarios:** see ### US-5.4 under Acceptance Criteria

### US-5.5: Unpublished recipes stay off the public list

**As a** recipe owner  
**I want** recipes with `isPublished = false` excluded from the public published list  
**So that** private recipes are not visible to visitors

**Priority:** P1  
**Independent test:** `GET /recipeapi/recipes` returns only rows with `isPublished: true`; unpublished owned recipes never appear for guests  
**Acceptance scenarios:** see ### US-5.5 under Acceptance Criteria

### US-5.6: Only the owner can change publish state

**As a** signed-in user  
**I want** only my own recipes’ publish flags to be updatable by me  
**So that** other users cannot publish or unpublish my recipes

**Priority:** P1  
**Independent test:** Cross-user `PUT` that changes `isPublished` returns `404`; owner update succeeds  
**Acceptance scenarios:** see ### US-5.6 under Acceptance Criteria

---



## Requirements:



### Functional Requirements

- **FR-001**: Every recipe MUST store a boolean `isPublished` (required; never null).
- **FR-002**: New recipes MUST default to `isPublished: false` unless the owner explicitly sets the publish switch to Yes.
- **FR-003**: `GET /recipeapi/recipes` MUST be public (no auth) and MUST return only recipes where `isPublished = true`, ordered alphabetically by `name`, including nested steps and ingredients needed for card detail.
- **FR-004**: Signed-in owners MUST be able to set `isPublished` on create (`POST /recipeapi/recipes`) and on update (`PUT /recipeapi/recipes/:id`) for recipes they own.
- **FR-005**: Changing `isPublished` MUST require authentication; unauthenticated create/update MUST return `401`.
- **FR-006**: Cross-user update of another user’s recipe (including `isPublished`) MUST return `404` — never `403`.
- **FR-007**: The login view MUST expose a **View Published Recipes** action that navigates to the recipes route without signing in.
- **FR-008**: When no signed-in user is present, the recipes view MUST load via `GET /recipeapi/recipes` (published only) and MUST NOT show **Add** or edit/PDF owner actions.
- **FR-009**: Edit Recipe and Add Recipe UIs MUST include a **Publish?** switch labeled `Publish? Yes` / `Publish? No` reflecting the current `isPublished` value.
- **FR-010**: A recipe that is unpublished after having been published MUST disappear from subsequent public list responses.

---



## Assumptions

- Feature 1 auth/session, Feature 3 recipe CRUD/edit route, and Feature 4 steps/ingredients are merged to `dev` before implementing this feature.
- Guest browsing reuses the existing `recipes` route (`RecipeList.vue`) rather than a separate public-only route.
- Nested step/ingredient payloads on the published list may come from the list response includes and/or Feature 4 read endpoints already used by recipe cards.
- Recipe create/update field validation beyond `isPublished` remains owned by Feature 3.



## Edge Cases

- Missing `isPublished` on create → `400` with a clear message (e.g. `"Is Published cannot be empty for recipe!"`).
- Unauthenticated `PUT` / `POST` for recipes → `401`.
- Unowned recipe id on publish update → `404`.
- Zero published recipes → empty list UI with quoted empty-state copy (see Screen Requirements).
- Owner unpublishes while a guest had the list open → next fetch omits that recipe.



## Success Criteria

- **SC-001**: Every Gherkin scenario has at least one automated test before merge.
- **SC-002**: A visitor can open **View Published Recipes** from login and see only published recipes; an owner can publish/unpublish from edit (and create) and the public list updates accordingly.
- **SC-003**: `npm test` passes for published-recipe API and login/recipes guest UI behavior.

---



## Data Ownership & Isolation

Recipes remain owned by one user. Publishing grants **read** visibility to everyone for that recipe only; write access stays owner-scoped.


| Rule                  | Requirement                                                                                                                                                      |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Public read scope** | `GET /recipeapi/recipes` returns recipes where `isPublished = true` for any caller (auth optional).                                                              |
| **Owner read scope**  | Signed-in `GET /recipeapi/recipes/user/:userId` (Feature 3) returns that user’s recipes regardless of publish state (only for the authenticated owner’s own id). |
| **Write scope**       | `PUT` / `DELETE` apply only when the recipe matches both `id` and `req.user.id`.                                                                                 |
| **Create scope**      | New recipes are owned by the authenticated user; `isPublished` comes from the request body (boolean).                                                            |
| **Cross-user write**  | Another user’s recipe → `404` (do not confirm the recipe exists via `403`).                                                                                      |
| **UI scope**          | Guest recipes view shows only published recipes from `GET /recipeapi/recipes`. Owner edit UI may show and change `isPublished` for owned recipes only.           |
| **Implementation**    | Prefer a shared ownership helper for update/delete (e.g. `getAccessibleRecipeOrNull`) — do not duplicate owner checks inconsistently across controllers.         |


---



## API Requirements


| Method | Endpoint                 | Auth | Purpose                                                        |
| ------ | ------------------------ | ---- | -------------------------------------------------------------- |
| `GET`  | `/recipeapi/recipes`     | No   | Fetch all **published** recipes (`isPublished: true`)          |
| `POST` | `/recipeapi/recipes/`    | Yes  | Create recipe including `isPublished` (Feature 3 + this field) |
| `PUT`  | `/recipeapi/recipes/:id` | Yes  | Update owned recipe including `isPublished`                    |


**Delta for this feature:** public published list; `isPublished` on create/update payloads and responses. Other recipe endpoints remain as defined in Feature 3 / living reference.

**Create / update body (publish-related fields shown; other recipe fields per Feature 3):**

```json
{
  "name": "Pasta Primavera",
  "description": "Spring vegetables over pasta",
  "servings": 4,
  "time": 30,
  "isPublished": true,
  "userId": 42
}
```

**Published list success response** (`200`) — array of recipes with `isPublished: true`, e.g.:

```json
[
  {
    "id": 1,
    "name": "Pasta Primavera",
    "description": "Spring vegetables over pasta",
    "servings": 4,
    "time": 30,
    "isPublished": true,
    "userId": 42,
    "recipeStep": [],
    "createdAt": "2026-09-10T12:00:00.000Z",
    "updatedAt": "2026-09-10T12:00:00.000Z"
  }
]
```

**Update success** (`200`): `{ "message": "Recipe was updated successfully." }` (or updated recipe object if Feature 3 standardizes on returning the row — stay consistent with Feature 3).

**Error response:** `{ "message": "Human-readable explanation." }` with appropriate HTTP status.  
**Not found / not owned:** `404` (do not use `403`).

---



## Screen Requirements



### [View: Login] — route name `login`

- Existing Feature 1 login / create-account chrome remains.
- Below the login card, a secondary card/action: **View Published Recipes** (`v-btn`, secondary) navigates to route `recipes` without authenticating.



### [View: Recipes] — route name `recipes` (`RecipeList.vue`)

**Guest / published mode** (no `user` in `localStorage`)

- Heading: **Recipes**
- Loads `GET /recipeapi/recipes` (published only).
- Renders each published recipe with `RecipeCard` (name, servings chip, time chip, description; expand for ingredients/steps).
- **Must not** show **Add**, edit pencil, or PDF actions.
- **Empty state:** **"No published recipes yet."** when the public list is empty.
- **Loading state:** progress/skeleton while fetching.
- **Error state:** snackbar or `<v-alert type="error">` for API failures.

**Signed-in mode** (Feature 3): shows the user’s recipes; Add Recipe dialog includes the **Publish?** switch (US-5.2). Guest publish browsing is the Feature 5 concern for this view.

### [View: Edit Recipe] — route name `editRecipe`

- Recipe fields from Feature 3 / 4 remain.
- **Publish?** `<v-switch>` with label `Publish? Yes` or `Publish? No` bound to `recipe.isPublished`.
- Primary save: **Update Recipe** persists `isPublished` with the rest of the recipe.

**App chrome**

- Guests may use MenuBar **Login** to return to the login route; owner-only nav (e.g. Ingredients) stays hidden when `user === null`.

---



## Key Entities

- **Recipe**: owned meal definition; this feature adds publish visibility via `isPublished` (base fields from Feature 3).
- **User**: owns recipes (Feature 1); only the owner may change publish state.
- **RecipeStep / RecipeIngredient / Ingredient**: displayed on published cards (Feature 4); not redefined here.

---



## Data Model Requirements



### `recipes` table — **delta** (field introduced/owned by this feature)


| Field         | Type    | Rules                                                                                |
| ------------- | ------- | ------------------------------------------------------------------------------------ |
| `isPublished` | BOOLEAN | Required (`allowNull: false`); default `false` for new recipes unless set explicitly |


Other recipe columns (`id`, `name`, `description`, `servings`, `time`, `userId`, timestamps) are defined in Feature 3 / `features/reference/data-model.md`.

### Associations

- No new associations. Existing `User hasMany Recipe` / `Recipe belongsTo User` unchanged.

---



## Acceptance Criteria (Gherkin)



### US-5.1 — Publish or unpublish from edit recipe



#### Scenario: Owner publishes a recipe

- **Given** I am signed in
- **And** I own a recipe named `Pasta Primavera` with `isPublished` false
- **When** I open the edit recipe screen for `Pasta Primavera`
- **And** I set the **Publish?** switch to Yes
- **And** I click **Update Recipe**
- **Then** the API returns `200`
- **And** the recipe’s `isPublished` is `true` in the database
- **And** `Pasta Primavera` appears in `GET /recipeapi/recipes`



#### Scenario: Owner unpublishes a recipe

- **Given** I am signed in
- **And** I own a published recipe named `Pasta Primavera`
- **When** I set **Publish?** to No on the edit recipe screen
- **And** I click **Update Recipe**
- **Then** the API returns `200`
- **And** the recipe’s `isPublished` is `false`
- **And** `Pasta Primavera` does not appear in `GET /recipeapi/recipes`

---



### US-5.2 — Choose publish when creating a recipe



#### Scenario: User creates a published recipe

- **Given** I am signed in on the recipes view
- **When** I open **Add** recipe
- **And** I fill required recipe fields
- **And** I set **Publish?** to Yes
- **And** I confirm **Add Recipe**
- **Then** the created recipe has `isPublished: true`
- **And** the recipe appears in `GET /recipeapi/recipes`



#### Scenario: User creates a private recipe by default

- **Given** I am signed in on the recipes view
- **When** I open **Add** recipe
- **And** I leave **Publish?** as No
- **And** I confirm **Add Recipe**
- **Then** the created recipe has `isPublished: false`
- **And** the recipe does not appear in `GET /recipeapi/recipes`

---



### US-5.3 — View published recipes from login



#### Scenario: Visitor opens published recipes from login

- **Given** I am on the login page with no session in `localStorage`
- **And** at least one published recipe exists
- **When** I click **View Published Recipes**
- **Then** I navigate to the recipes view
- **And** published recipes are listed
- **And** I do not see the **Add** button



#### Scenario: No published recipes

- **Given** I am on the login page with no session
- **And** there are no published recipes
- **When** I click **View Published Recipes**
- **Then** I see **"No published recipes yet."**

---



### US-5.4 — Browse published recipe details



#### Scenario: Visitor expands a published recipe card

- **Given** I am viewing published recipes as a guest
- **And** a published recipe `Pasta Primavera` has steps and ingredients
- **When** I expand the `Pasta Primavera` card
- **Then** I see the recipe description, servings, and time
- **And** I see its ingredients and steps
- **And** I do not see edit or PDF icons

---



### US-5.5 — Unpublished recipes stay off the public list



#### Scenario: Public list excludes unpublished recipes

- **Given** user A owns published recipe `Shared Soup` and unpublished recipe `Secret Cake`
- **When** anyone requests `GET /recipeapi/recipes`
- **Then** the response includes `Shared Soup`
- **And** the response does not include `Secret Cake`



#### Scenario: Guest UI does not show unpublished recipes

- **Given** unpublished recipe `Secret Cake` exists
- **And** I am not signed in
- **When** I open the recipes view via **View Published Recipes**
- **Then** `Secret Cake` does not appear

---



### US-5.6 — Only the owner can change publish state



#### Scenario: User cannot publish another user’s recipe

- **Given** I am signed in as user A
- **And** a recipe exists that belongs to user B
- **When** I send `PUT /recipeapi/recipes/:id` with user B’s recipe id and body including `{ "isPublished": true }`
- **Then** the API returns `404` with a not-found message
- **And** user B’s recipe `isPublished` is unchanged



#### Scenario: Unauthenticated user cannot update publish state

- **Given** I have no valid session token
- **When** I send `PUT /recipeapi/recipes/:id` with `{ "isPublished": true }`
- **Then** the API returns `401` with an unauthorized message

---



## Test Coverage Map


| Story  | Scenario                                         | Test file                                                                     | Test name                                          |
| ------ | ------------------------------------------------ | ----------------------------------------------------------------------------- | -------------------------------------------------- |
| US-5.1 | Owner publishes a recipe                         | `backend/tests/publishedRecipes.test.js`, `frontend/tests/EditRecipe.test.js` | `Owner publishes a recipe`                         |
| US-5.1 | Owner unpublishes a recipe                       | `backend/tests/publishedRecipes.test.js`, `frontend/tests/EditRecipe.test.js` | `Owner unpublishes a recipe`                       |
| US-5.2 | User creates a published recipe                  | `backend/tests/publishedRecipes.test.js`, `frontend/tests/RecipeList.test.js` | `User creates a published recipe`                  |
| US-5.2 | User creates a private recipe by default         | `backend/tests/publishedRecipes.test.js`, `frontend/tests/RecipeList.test.js` | `User creates a private recipe by default`         |
| US-5.3 | Visitor opens published recipes from login       | `frontend/tests/Login.test.js`, `frontend/tests/RecipeList.test.js`           | `Visitor opens published recipes from login`       |
| US-5.3 | No published recipes                             | `frontend/tests/RecipeList.test.js`                                           | `No published recipes`                             |
| US-5.4 | Visitor expands a published recipe card          | `frontend/tests/RecipeList.test.js`                                           | `Visitor expands a published recipe card`          |
| US-5.5 | Public list excludes unpublished recipes         | `backend/tests/publishedRecipes.test.js`                                      | `Public list excludes unpublished recipes`         |
| US-5.5 | Guest UI does not show unpublished recipes       | `frontend/tests/RecipeList.test.js`                                           | `Guest UI does not show unpublished recipes`       |
| US-5.6 | User cannot publish another user’s recipe        | `backend/tests/publishedRecipes.test.js`                                      | `User cannot publish another user’s recipe`        |
| US-5.6 | Unauthenticated user cannot update publish state | `backend/tests/publishedRecipes.test.js`                                      | `Unauthenticated user cannot update publish state` |


---



## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 5 from @features/feature-5-published-recipe-management.md on branch `feature/5-published-recipe-management`.

Follow layer order in @features/framework.md (models → routes → backend tests → frontend → frontend tests).
Map every Gherkin scenario in the Test Coverage Map; run `npm test` before finishing.
If API routes, payloads, schema, or product rules changed per this spec, update @features/reference/api.md, @features/reference/data-model.md, and/or @features/reference/behavior.md in the same PR to match shipped code.
Complete Definition of Done and the merge checklist in @features/framework.md.
Do not implement behavior not in this spec.
```

**Reference updates for this feature:** `features/reference/data-model.md`, `features/reference/api.md`, `features/reference/behavior.md`

---



## Definition of Done

- [ ] Backend and frontend implemented per this spec (**FR-00N** satisfied)
- [ ] **Success Criteria (SC-00N)** met
- [ ] All mapped tests pass (`npm test`)
- [ ] Test Coverage Map complete
- [ ] `features/reference/data-model.md` updated (if schema changed)
- [ ] `features/reference/api.md` updated (if API changed)
- [ ] `features/reference/behavior.md` updated (if product rules changed)

---



## Out of Scope

- Recipe create/edit fields other than `isPublished` (Feature 3)
- Steps and ingredient CRUD (Feature 4)
- Account registration / login / session mechanics (Feature 1)
- Social sharing, comments, ratings, or follow/subscribe
- Admin moderation or forced unpublish of others’ recipes
- Separate public “discover” route distinct from `recipes` (reuses guest mode on `RecipeList.vue`)

