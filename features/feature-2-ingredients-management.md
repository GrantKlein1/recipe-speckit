# Feature: Ingredients Management

**Feature ID:** 2  
**Branch pattern:** `feature/2-ingredients-management`  
**Status:** Ready  
**Created:** 2026-09-16  
**Input:** Users maintain a shared catalog of ingredients with name, unit, and price per unit so recipes can reference them later  
**Depends on:** [Feature 1 — User Auth, Profile & Session Management](feature-1-account-management.md)

---

## User Stories

### US-2.1: View ingredients

**As a** visitor or signed-in user  
**I want to** open the Ingredients page and see all ingredients  
**So that** I know what ingredients exist and their unit and price

**Priority:** P1  
**Independent test:** Open /ingredients; table lists name, unit, and price per unit for every ingredient  
**Acceptance scenarios:** see ### US-2.1 under Acceptance Criteria

### US-2.2: Add an ingredient

**As a** signed-in user  
**I want to** add an ingredient with name, unit, and price per unit  
**So that** the catalog grows for use in recipes

**Priority:** P1  
**Independent test:** Sign in, click **Add**, submit valid fields; new row appears in the table  
**Acceptance scenarios:** see ### US-2.2 under Acceptance Criteria

### US-2.3: Edit an ingredient

**As a** signed-in user  
**I want to** edit an existing ingredient’s name, unit, and price per unit  
**So that** I can correct catalog data

**Priority:** P1  
**Independent test:** Open edit via pencil icon, change fields, save; table shows updated values after refresh  
**Acceptance scenarios:** see ### US-2.3 under Acceptance Criteria

### US-2.4: Validate ingredient fields

**As a** signed-in user  
**I want** invalid or incomplete ingredient data rejected  
**So that** the catalog stays usable

**Priority:** P1  
**Independent test:** Omit name, unit, or pricePerUnit on create → 400; unit must be from the allowed list in the UI  
**Acceptance scenarios:** see ### US-2.4 under Acceptance Criteria

---



## Requirements



### Functional Requirements

- **FR-001**: The Ingredients page must list all ingredients ordered by name ascending.
- **FR-002**: Each ingredient must have a name, unit, and pricePerUnit.
- **FR-003**: Creating an ingredient must require authentication.
- **FR-004**: Updating an ingredient must require authentication.
- **FR-005**: Reading ingredients may be allowed without authentication.
- **FR-006**: On create, name, unit, and pricePerUnit must all be present; missing any must return 400.
- **FR-007**: On create/update from the UI, unit must be chosen from the allowed unit list: cup, gallon, gram, kilogram, liter, milliliter, ounce, pint, piece, pound, quart, tablespoon, teaspoon, unit.
- **FR-008**: The **Add** control on the Ingredients page must be visible only when a signed-in user is present in client session storage.
- **FR-009**: Signed-in users must be able to open an add dialog and an edit dialog with fields for name, unit, and price per unit.
- **FR-010**: Successful add/update must refresh the ingredients list and show a success snackbar; API failures must show an error snackbar.
- **FR-011**: Ingredients in this feature are a **shared global catalog**. Any authenticated user MAY create or update any ingredient.
- **FR-012**: Menu navigation must expose **Ingredients** for signed-in users.

---



## Assumptions

- Feature 1 is available on dev before this feature is treated as complete.
- Ingredient rows are shared across all users.
- Attaching ingredients to recipes belongs to later features, not this catalog CRUD.
- Delete-ingredient UI is not required for this feature’s ship criteria.
- Price is stored as a decimal suitable for currency display.

---



## Edge Cases

- Empty or missing name, unit, or pricePerUnit on create → 400.
- Unauthenticated POST /recipeapi/ingredients/ or PUT /recipeapi/ingredients/:id → 401.
- Update of unknown id → failure message.
- Guest on Ingredients page: list still loads; **Add** is hidden.
- Signed-out user who somehow calls create/update via API → 401.

---



## Success Criteria

- **SC-001**: Every Gherkin scenario below has at least one automated test before merge.
- **SC-002**: A signed-in user can add and edit ingredients end-to-end from /ingredients.
- **SC-003**: Guests can view the ingredients list; unauthenticated writes are rejected.
- **SC-004**: npm test passes for this feature’s mapped tests.

---



## Data Ownership & Isolation

Ingredients are a **shared catalog**, not private per user.


| Rule                      | Requirement                                                                                                    |
| ------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Read scope**            | GET /recipeapi/ingredients and GET /recipeapi/ingredients/:id return catalog rows without requiring a session. |
| **Write scope**           | POST and PUT require a valid session. Any authenticated user may create or update any ingredient.              |
| **No per-user ownership** | Do not set or trust a client-supplied owner on ingredient rows for this feature.                               |
| **Cross-user isolation**  | N/A                                                                                                            |
| **UI gate**               | Hide **Add** when user is null; edit icons remain available in the current app.                                |


---



## Key Entities

- **Ingredient**: catalog item with a display name, measurement unit, and price per unit; shared across users; referenced later by recipe–ingredient links.
- **User / Session**: required for create and update; established by Feature 1.

---



## API Requirements


| Method | Endpoint                   | Auth | Purpose                              |
| ------ | -------------------------- | ---- | ------------------------------------ |
| GET    | /recipeapi/ingredients/    | No   | List all ingredients ordered by name |
| GET    | /recipeapi/ingredients/:id | No   | Fetch one ingredient                 |
| POST   | /recipeapi/ingredients/    | Yes  | Create an ingredient                 |
| PUT    | /recipeapi/ingredients/:id | Yes  | Update an ingredient                 |
| DELETE | /recipeapi/ingredients/:id | Yes  | Delete one ingredient                |
| DELETE | /recipeapi/ingredients/    | Yes  | Delete all ingredients               |


**Create request body:**

```json
{
  "name": "Flour",
  "unit": "cup",
  "pricePerUnit": 0.45
}
```

**Ingredient success response:**

```json
{
  "id": 1,
  "name": "Flour",
  "unit": "cup",
  "pricePerUnit": "0.45",
}
```

**Update success:** message Ingredient was updated successfully.  
**Error response:** message with a human-readable explanation and appropriate HTTP status.  
**Unauthorized:** 401 when session or token is missing or invalid on protected routes.

---



## Screen Requirements



### [View: Ingredients] — route name ingredients, path /ingredients

**Shell**

- Reachable from MenuBar **Ingredients** when signed in.
- Page title: **Ingredients**.
- Primary CTA: **Add**, shown only when a user is signed in.

**List table**

- Columns: **Name**, **Unit**, **Price Per Unit**, **Actions**.
- Price displayed with a currency prefix.
- **Actions:** edit opens the edit dialog for that row.
- **Loading / error:** show progress or snackbar/alert on fetch failure.

**Add / Edit dialog**

- Titles: **Add Ingredient** / **Edit Ingredient**.
- Fields: **Name**, **Unit** from the allowed unit list, **Price Per Unit**.
- Actions: **Close**, **Add Ingredient** / **Update Ingredient**.
- On success: close dialog, refresh list, success snackbar.
- On failure: error snackbar with API message.

---



## Data Model Requirements



### ingredients table


| Field        | Type       | Rules                                 |
| ------------ | ---------- | ------------------------------------- |
| id           | INTEGER PK | Auto-increment                        |
| name         | STRING     | Required                              |
| unit         | STRING     | Required                              |
| pricePerUnit | DECIMAL    | Required on create via API validation |




### Associations

- No userId on ingredients for this feature.
- Recipe–ingredient join associations are owned by later features; this feature only requires the standalone ingredient model.

---



## Acceptance Criteria



### US-2.1 — View ingredients



#### Scenario: User views the ingredients list

- **Given** the catalog contains ingredients Flour and Sugar
- **When** I open the Ingredients page
- **Then** I see a table including Flour and Sugar
- **And** each row shows name, unit, and price per unit



#### Scenario: Ingredients list is ordered by name

- **Given** ingredients named Sugar and Butter exist
- **When** I request GET /recipeapi/ingredients/
- **Then** the API returns ingredients ordered by name ascending



#### Scenario: Guest can view ingredients without signing in

- **Given** I am not signed in
- **And** at least one ingredient exists
- **When** I open the Ingredients page or call GET /recipeapi/ingredients/
- **Then** I receive the ingredient list successfully



### US-2.2 — Add an ingredient



#### Scenario: Signed-in user adds an ingredient

- **Given** I am signed in on the Ingredients page
- **When** I click **Add**
- **And** I enter name Olive Oil, unit tablespoon, and price per unit 0.10
- **And** I confirm **Add Ingredient**
- **Then** the API creates the ingredient
- **And** Olive Oil appears in the table
- **And** I see a success snackbar



#### Scenario: Add button is hidden when signed out

- **Given** I am not signed in on the Ingredients page
- **When** I view the page header actions
- **Then** I do not see the **Add** button



### US-2.3 — Edit an ingredient



#### Scenario: Signed-in user updates an ingredient

- **Given** I am signed in
- **And** ingredient Flour exists with unit cup and price 0.45
- **When** I click the edit icon on Flour
- **And** I change the price per unit to 0.50
- **And** I confirm **Update Ingredient**
- **Then** the API updates the ingredient
- **And** the table shows Flour with price 0.50
- **And** I see a success snackbar



### US-2.4 — Writes require a session



#### Scenario: Unauthenticated create is rejected

- **Given** I have no valid session token
- **When** I send POST /recipeapi/ingredients/ with a valid body
- **Then** the API returns 401



#### Scenario: Unauthenticated update is rejected

- **Given** I have no valid session token
- **And** an ingredient with id 1 exists
- **When** I send PUT /recipeapi/ingredients/1 with a body changing the name
- **Then** the API returns 401



### US-2.5 — Validate ingredient fields



#### Scenario: Create without name is rejected

- **Given** I am signed in
- **When** I send POST /recipeapi/ingredients/ with body missing name but including unit and pricePerUnit
- **Then** the API returns 400
- **And** the message indicates name cannot be empty



#### Scenario: Create without unit is rejected

- **Given** I am signed in
- **When** I send POST /recipeapi/ingredients/ with body missing unit
- **Then** the API returns 400
- **And** the message indicates unit cannot be empty



#### Scenario: Create without price per unit is rejected

- **Given** I am signed in
- **When** I send POST /recipeapi/ingredients/ with body missing pricePerUnit
- **Then** the API returns 400
- **And** the message indicates price per unit cannot be empty

---



## Test Coverage Map


| Story  | Scenario                                      | Test file                                                                | Test name                                     |
| ------ | --------------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------- |
| US-2.1 | User views the ingredients list               | frontend/tests/IngredientList.test.js                                    | User views the ingredients list               |
| US-2.1 | Ingredients list is ordered by name           | backend/tests/ingredients.test.js                                        | Ingredients list is ordered by name           |
| US-2.1 | Guest can view ingredients without signing in | backend/tests/ingredients.test.js                                        | Guest can view ingredients without signing in |
| US-2.2 | Signed-in user adds an ingredient             | backend/tests/ingredients.test.js, frontend/tests/IngredientList.test.js | Signed-in user adds an ingredient             |
| US-2.2 | Add button is hidden when signed out          | frontend/tests/IngredientList.test.js                                    | Add button is hidden when signed out          |
| US-2.3 | Signed-in user updates an ingredient          | backend/tests/ingredients.test.js, frontend/tests/IngredientList.test.js | Signed-in user updates an ingredient          |
| US-2.4 | Unauthenticated create is rejected            | backend/tests/ingredients.test.js                                        | Unauthenticated create is rejected            |
| US-2.4 | Unauthenticated update is rejected            | backend/tests/ingredients.test.js                                        | Unauthenticated update is rejected            |
| US-2.5 | Create without name is rejected               | backend/tests/ingredients.test.js                                        | Create without name is rejected               |
| US-2.5 | Create without unit is rejected               | backend/tests/ingredients.test.js                                        | Create without unit is rejected               |
| US-2.5 | Create without price per unit is rejected     | backend/tests/ingredients.test.js                                        | Create without price per unit is rejected     |


---



## Agent implementation request

Copy when asking Cursor to implement this feature:

```text
Implement Feature 2 from @features/feature-2-ingredients-management.md on branch feature/2-ingredients-management.

Follow layer order in @features/framework.md.
Map every Gherkin scenario in the Test Coverage Map; run npm test before finishing.
If API routes, payloads, schema, or product rules changed per this spec, update @features/reference/api.md, @features/reference/data-model.md, and/or @features/reference/behavior.md in the same PR to match shipped code.
Complete Definition of Done and the merge checklist in @features/framework.md.
Do not implement behavior not in this spec.
```

**Reference updates for this feature:** features/reference/data-model.md, features/reference/api.md, features/reference/behavior.md

---



## Definition of Done

- [x] Backend and frontend implemented per this spec
- [x] Success Criteria met
- [x] All mapped tests pass
- [x] Test Coverage Map complete
- [x] features/reference/data-model.md updated if schema changed
- [x] features/reference/api.md updated if API changed
- [x] features/reference/behavior.md updated if product rules changed

---



## Out of Scope

- Attaching ingredients to recipes / recipe quantities → Feature 3 / Feature 4
- Published recipes and public recipe browse → Feature 5
- Delete-ingredient button/flow in the Ingredients UI
- Bulk delete-all ingredients as a product action
- Per-user private ingredient catalogs
- Search, filter, or sort controls beyond default name ordering
- Ingredient images, categories, or nutrition data

