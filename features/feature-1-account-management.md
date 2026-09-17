# Feature: User Authentication & Session Management

**Feature ID:** 1
**Branch pattern:** `feature-1-account-management`
**Status:** Ready
**Created:** 2026-09-09
**Input:** Multi-user authentication and session management so each user can sign in and access private recipe data as well as view public recipes without signing in
**Related:** `features/reference/api.md`, `features/reference/data-model.md`, `features/reference/behavior.md`

---

## User Stories

### US-1.1: Register an account

**As a** new user
**I want to** create an account with my first name, last name, email, and password
**So that** I can sign in and manage my own private recipes

**Priority:** P1
**Independent test:** Submit a valid registration, receive a session token, then store `user` in `localStorage`, and go to the recipes page
**Acceptance scenarios:** see ### US-1.1 under Acceptance Criteria

### US-1.2: Sign in

**As a** registered user
**I want to** sign in with my email and password
**So that** I can access the recipes page securely

**Priority:** P1
**Independent test:** Sign in with known email and password and receive session token and then redirect to recipes menu page
**Acceptance scenarios:** see ### US-1.2 under Acceptance Criteria

### US-1.3: Stay signed in across page loads

**As a** signed-in user
**I want** my session to persist in the browser
**So that** I do not have to sign in again every time I refresh the page

**Priority:** P1
**Independent test:** Refresh or revisit a session required route with a valid `localStorage` session without having to sign in again
**Acceptance scenarios:** see ### US-1.3 under Acceptance Criteria

### US-1.4: Sign out

**As a** signed-in user
**I want to** sign out
**So that** no one else can use my account on a shared device and see my recipes except for the ones I published

**Priority:** P2
**Independent test:** Sign out clears the server session and `localStorage` and user goes to login page
**Acceptance scenarios:** see ### US-1.4 under Acceptance Criteria

### US-1.5: Guard private screens; allow guest published recipes

**As the** application
**I want to** require a valid session for ingredients and recipe edit, while allowing guests to view published recipes
**So that** users can only change private recipe data when signed in, and anyone can still see published recipes

**Priority:** P1
**Independent test:** Open `/ingredients` or `/recipe/:id` without a session then go to login page or open published recipes from login without signing in. protected API without token then throw `401`
**Acceptance scenarios:** see ### US-1.5 under Acceptance Criteria

---



## Requirements



### Functional Requirements

- **FR-001**: Users MUST authenticate with **email** + **password** (not username).
- **FR-002**: Registration MUST collect first name, last name, email, and password.
- **FR-003**: Passwords MUST be hashed with Node `crypto.scrypt` and a per-user random salt before persistence; `password` and `salt` MUST never be returned by the API.
- **FR-004**: Sessions MUST use a **Session table + encrypted session id** as the client token (AES-256-GCM). Login MUST authenticate with `Authorization: Basic <base64(email:password)>`. Subsequent authenticated requests MUST send `Authorization: Bearer <token>`.
- **FR-005**: Session lifetime MUST be **24 hours** from creation (`expirationDate`).
- **FR-006**: Login MUST create a **new** Session row for each successful sign-in (do not reuse an existing non-expired session).
- **FR-007**: Successful registration MUST create a Session for the new user and return the same payload shape as login so the user is signed in immediately.
- **FR-008**: Every authenticated request MUST resolve to exactly one user via `req.user.id` from the session token (foundation for Features 2–5 ownership).
- **FR-009**: Guests MUST be able to view published recipes without signing in.
- **FR-010**: Routes `ingredients` (`/ingredients`) and `editRecipe` (`/recipe/:id`) MUST require a valid session; unauthenticated navigation MUST redirect to login.
- **FR-011**: After successful login or registration, the client MUST store the response payload in `localStorage` under the key `user` (including `token`) and attach `Authorization: Bearer <token>` on later API calls.

---



## Assumptions

- No external identity provider (email + password only).
- Single browser `localStorage` session per device (no multi-tab sync beyond shared storage).
- Ingredient CRUD, recipe CRUD, recipe steps/ingredients, and the publish toggle are Features 2–5. Feature 1 owns auth, session persistence, logout, route guards, and guest read of already-published recipes.
- The recipes page (`RecipeList`) is the post-login landing page and the guest published-recipe view — not a separate placeholder home.
- Full published-recipe management (creating/toggling `isPublished`) is Feature 5; Feature 1 only requires that guests can open the existing published list.



## Edge Cases

- Duplicate email on register → `400` with `{ "message": "This email is already in use." }`.
- Unknown email on login → `401` with `{ "message": "User not found!" }`.
- Wrong password on login → `401` with `{ "message": "Invalid password!" }`.
- Missing required register fields → `400` with the matching empty-field message (see API Requirements).
- Missing, invalid, or expired Bearer token on a protected API → `401`; frontend must not keep using that session for guarded routes.
- Visiting login while already signed in → stay signed in and go to recipes (do not clear `localStorage`).



## Success Criteria

- **SC-001**: Every Gherkin scenario in this feature has at least one automated test before merge.
- **SC-002**: A new user can register, sign in, reach the recipes page, and sign out in one manual pass.
- **SC-003**: `npm test` passes with backend auth and frontend login / router / MenuBar coverage mapped below.
- **SC-004**: A guest who is not signed in can open **View Published Recipes** from login and see the published recipe list.

---



## Data Ownership & Isolation

Each account owns its own User row and Session rows. This feature does not implement recipe or ingredient CRUD; it establishes the caller identity later features use. Guests may **read** published recipes only.


| Rule                  | Requirement                                                                                                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Read scope**        | Authenticated requests resolve exactly one user from the Session row (`req.user.id`). Guests may read recipes where `isPublished = true` via `GET /recipeapi/recipes/` (no token).                                  |
| **Write scope**       | Feature 1 writes only User (register) and Session (register/login/logout). Logout destroys the Session identified by the Bearer token. Recipe/ingredient writes are later features and require `authenticateRoute`. |
| **Create scope**      | New User from the register body. New Session `userId` is the created or authenticated user — never taken from an untrusted client id for login.                                                                     |
| **Cross-user access** | A token MUST authenticate only the user on that Session. Invalid/expired/missing token → `401` (not `403`). This feature does not define cross-user recipe `404` (Feature 3).                                       |
| **UI scope**          | Signed-in recipes view loads that user’s recipes. Guest recipes view shows published recipes only. **Ingredients** and recipe edit are hidden or redirected unless `user` is in `localStorage`.                     |
| **Implementation**    | `authenticateRoute` in `backend/app/authentication/authentication.js` sets `req.user = { id: session.userId }`. Do not invent a separate `app/authorization/` helper in this feature.                               |


---



## Key Entities

- **User**: account owner; can have multiple recipes and ingredients
- **Session**: server-side record tying an encrypted client token to one user; expires 24 hours after creation
- **Recipe**: holds ingredients and steps; belongs to one user; can be visible to other users if the owner so chooses (guest read of published recipes in this feature; full recipe behavior in Features 3 and 5)

---



## API Requirements

Mount prefix: `/recipeapi` (see `backend/server.js`). Flat JSON; errors `{ "message": "…" }`. Do not wrap in `{ success, data }`.


| Method | Endpoint              | Auth                     | Purpose                                        |
| ------ | --------------------- | ------------------------ | ---------------------------------------------- |
| `POST` | `/recipeapi/users/`   | No                       | Register; create User + Session                |
| `POST` | `/recipeapi/login`    | Basic (`email:password`) | Sign in; create Session                        |
| `POST` | `/recipeapi/logout`   | Bearer                   | Destroy Session                                |
| `GET`  | `/recipeapi/recipes/` | No                       | List published recipes for guests (and anyone) |


**Protected-route contract (this feature):** any route using `authenticateRoute` MUST return `401` when the Bearer token is missing, invalid, or expired, and MUST set `req.user.id` when valid. Example already in the running app: `GET /recipeapi/recipes/user/:userId`. Feature 1 does not redefine that endpoint’s success payload (Feature 3).

### Register — `POST /recipeapi/users/`

**Request body:**

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",
  "password": "secret123"
}
```

**Success** (`200`):

```json
{
  "email": "jane@example.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "id": 1,
  "token": "<encrypted-session-id>"
}
```

Password and salt MUST be omitted.

**Errors (**`400`**):**


| Condition                | `message`                              |
| ------------------------ | -------------------------------------- |
| Missing `firstName`      | `First name cannot be empty for user!` |
| Missing `lastName`       | `Last name cannot be empty for user!`  |
| Missing `email`          | `Email cannot be empty for user!`      |
| Missing `password`       | `Password cannot be empty for user!`   |
| Email already registered | `This email is already in use.`        |




### Login — `POST /recipeapi/login`

**Headers:** `Authorization: Basic <base64(email:password)>`  
The JSON body is not the credential source.

**Success** (`200`): same shape as register (`email`, `firstName`, `lastName`, `id`, `token`). Always insert a **new** Session row with `expirationDate` = now + 24 hours.

**Errors (**`401`**):**


| Condition               | `message`           |
| ----------------------- | ------------------- |
| Email not found         | `User not found!`   |
| Password does not match | `Invalid password!` |




### Logout — `POST /recipeapi/logout`

**Headers:** `Authorization: Bearer <token>`

**Success** (`200`): `{ "message": "Logged out successfully." }` — Session row for that token is destroyed.

**Errors (**`401`**):** `{ "message": "Invalid session" }` or `{ "message": "Authentication required" }` when the header is missing/invalid.

### Published recipes — `GET /recipeapi/recipes/`

**Auth:** none.

**Success** (`200`): JSON array of recipes with `isPublished = true`. Field-level recipe shape is owned by Features 3 and 5; this feature only requires the call to succeed without a token so guests can view the list.

---



## Screen Requirements

Follow [ui-style-system.mdc](../.cursor/rules/ui-style-system.mdc) for theme tokens. Labels below match the running Recipe UI.

### [View: Login] — route name `login` (`/`)

- Heading: **Login**
- Fields: **Email**, **Password** (both required)
- Primary action: **Login**
- Secondary action: **Create Account** (opens the create-account dialog)
- Guest action: **View Published Recipes** — navigates to `recipes` **without** signing in
- **Create Account** dialog (`v-dialog`): fields **First Name**, **Last Name**, **Email**, **Password**; confirm **Create Account**; dismiss **Close**
- After successful login or create-account: store payload in `localStorage` key `user`, snackbar **"Login successful!"** or **"Account created successfully!"**, then `router.push({ name: "recipes" })`
- **Error:** snackbar shows the API `message` (not a silent fail)
- **Persist (US-1.3):** if `user` with a `token` is already in `localStorage` on this view, MUST NOT `removeItem("user")`. Redirect to `recipes` instead.
- No separate `/register` route — registration is this dialog on Login.



### [View: Recipe list] — route name `recipes` (`/recipes`)

Feature 1 only specifies **who may open this screen** and **which list they see**. Add/edit/delete recipe UI is Feature 3.

- Public: guests may open this route (from **View Published Recipes** or a direct URL)
- Guest: load published recipes (`GET /recipeapi/recipes/`); do not show **Add**
- Signed-in: load that user’s recipes; **Add** remains Feature 3
- Heading: **Recipes**
- **Error:** snackbar with API `message`
- No empty-state copy exists in the running view — do not invent one in this feature



### [View: Ingredient list] — route name `ingredients` (`/ingredients`)

- Feature 2 owns the ingredient UI.
- Feature 1: unauthenticated visit MUST redirect to `login`.



### [View: Edit recipe] — route name `editRecipe` (`/recipe/:id`)

- Features 3–4 own the editor.
- Feature 1: unauthenticated visit MUST redirect to `login`. Pencil/edit control on a recipe card is shown only when `user` is present (running `RecipeCardComponent`).



### App chrome — `MenuBar` (always mounted from `App.vue`)

- Brand title **Recipes**; logo links to `recipes`
- Nav: **Recipes**
- Signed out: **Login**
- Signed in: **Ingredients**; avatar menu shows first/last name, email, and **Logout**
- **Logout** calls `POST /recipeapi/logout`, removes `localStorage` `user`, then `router.push({ name: "login" })`



### Router guards (Feature 1)


| Route         | Session required?                                |
| ------------- | ------------------------------------------------ |
| `login`       | No. If already signed in, redirect to `recipes`. |
| `recipes`     | No (guest published list + signed-in own list)   |
| `ingredients` | Yes → else `login`                               |
| `editRecipe`  | Yes → else `login`                               |


---



## Data Model Requirements



### `users` table


| Field       | Type       | Rules                                                  |
| ----------- | ---------- | ------------------------------------------------------ |
| `id`        | INTEGER PK | Auto-increment                                         |
| `firstName` | STRING     | Required                                               |
| `lastName`  | STRING     | Required                                               |
| `email`     | STRING     | Required; unique for register                          |
| `password`  | BLOB       | Required; scrypt hash only; never returned in JSON     |
| `salt`      | BLOB       | Required; per-user random salt; never returned in JSON |


No `username` or `role` columns (not in the running User model).

### `sessions` table


| Field            | Type       | Rules                                                |
| ---------------- | ---------- | ---------------------------------------------------- |
| `id`             | INTEGER PK | Auto-increment; encrypted form is the client `token` |
| `email`          | STRING     | Required; copy of the user’s email at session create |
| `expirationDate` | DATE       | Required; create time + 24 hours                     |
| `userId`         | INTEGER FK | Required; references `users.id`; `ON DELETE CASCADE` |


The client token is **not** stored as a plaintext column; it is the AES-256-GCM encryption of `sessions.id`.

### Associations

- `User` hasMany `Session`
- `Session` belongsTo `User`
- `User` hasMany `Recipe` (existing; recipe columns and publish toggle are Features 3 and 5). Guest list filters `Recipe.isPublished = true`.

---



## Acceptance Criteria



### US-1.1 — Register an account



#### Scenario: User registers with valid first name, last name, email, and password

- **Given** I am on the login page
- **When** I click **Create Account**
- **And** I enter first name `Jane`, last name `Doe`, email `jane@example.com`, and a password
- **And** I click **Create Account** in the dialog
- **Then** `POST /recipeapi/users/` returns `200` with `id`, `email`, `firstName`, `lastName`, and `token`
- **And** the response MUST NOT include `password` or `salt`
- **And** `user` is stored in `localStorage`
- **And** I am redirected to the recipes page



#### Scenario: User registers with a duplicate email

- **Given** a user already exists with email `jane@example.com`
- **And** I am on the login page Create Account dialog
- **When** I submit registration with email `jane@example.com`
- **Then** the API returns `400` with `{ "message": "This email is already in use." }`
- **And** I remain on the login page



#### Scenario: User registers with a missing required field

- **Given** I am submitting `POST /recipeapi/users/`
- **When** the body omits `firstName` (or `lastName`, `email`, or `password`)
- **Then** the API returns `400` with the matching empty-field `message` from API Requirements



### US-1.2 — Sign in



#### Scenario: User signs in with valid email and password

- **Given** I am on the login page
- **And** a registered user exists with email `jane@example.com` and a known password
- **When** I enter that email and password
- **And** I click **Login**
- **Then** `POST /recipeapi/login` returns `200` with `id`, `email`, `firstName`, `lastName`, and `token`
- **And** a new Session row is created for that user
- **And** `user` is stored in `localStorage`
- **And** I am redirected to the recipes page



#### Scenario: User signs in with an unknown email

- **Given** I am on the login page
- **When** I enter email `missing@example.com` and any password
- **And** I click **Login**
- **Then** the API returns `401` with `{ "message": "User not found!" }`
- **And** I remain on the login page



#### Scenario: User signs in with an invalid password

- **Given** I am on the login page
- **And** a registered user exists with email `jane@example.com`
- **When** I enter that email and an incorrect password
- **And** I click **Login**
- **Then** the API returns `401` with `{ "message": "Invalid password!" }`
- **And** I remain on the login page



### US-1.3 — Stay signed in across page loads



#### Scenario: Signed-in user remains signed in after a page refresh

- **Given** I am signed in and on the recipes page with `user` in `localStorage`
- **When** I refresh the browser
- **Then** I remain on a signed-in recipes view without seeing the login form
- **And** `user` is still in `localStorage`



### US-1.4 — Sign out



#### Scenario: User signs out

- **Given** I am signed in
- **When** I click **Logout** in the MenuBar avatar menu
- **Then** `POST /recipeapi/logout` is called with the Bearer token
- **And** `user` is removed from `localStorage`
- **And** I am redirected to the login page



### US-1.5 — Guard private screens; allow guest published recipes



#### Scenario: Guest views published recipes without signing in

- **Given** I am on the login page and I am not signed in
- **When** I click **View Published Recipes**
- **Then** I am on the recipes page
- **And** `GET /recipeapi/recipes/` is called without requiring a token
- **And** I am not prompted to sign in



#### Scenario: Unauthenticated user is redirected from ingredients to login

- **Given** I have no `user` in `localStorage`
- **When** I navigate to `/ingredients`
- **Then** I am redirected to the login page



#### Scenario: Unauthenticated user is redirected from edit recipe to login

- **Given** I have no `user` in `localStorage`
- **When** I navigate to `/recipe/1`
- **Then** I am redirected to the login page



#### Scenario: Protected API request without a token returns 401

- **Given** no `Authorization` header
- **When** I request a route that uses `authenticateRoute` (for example `GET /recipeapi/recipes/user/1`)
- **Then** the API returns `401`



#### Scenario: Protected API request with an expired token returns 401

- **Given** a Bearer token whose Session `expirationDate` is in the past
- **When** I request a route that uses `authenticateRoute`
- **Then** the API returns `401`

---



## Test Coverage Map

Each scenario above must map to at least one automated test.


| Story  | Scenario                                                             | Test file                         | Test name                                                                    |
| ------ | -------------------------------------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------- |
| US-1.1 | User registers with valid first name, last name, email, and password | `backend/tests/user-auth.test.js` | `it("User registers with valid first name, last name, email, and password")` |
| US-1.1 | User registers with a duplicate email                                | `backend/tests/user-auth.test.js` | `it("User registers with a duplicate email")`                                |
| US-1.1 | User registers with a missing required field                         | `backend/tests/user-auth.test.js` | `it("User registers with a missing required field")`                         |
| US-1.2 | User signs in with valid email and password                          | `backend/tests/user-auth.test.js` | `it("User signs in with valid email and password")`                          |
| US-1.2 | User signs in with an unknown email                                  | `backend/tests/user-auth.test.js` | `it("User signs in with an unknown email")`                                  |
| US-1.2 | User signs in with an invalid password                               | `backend/tests/user-auth.test.js` | `it("User signs in with an invalid password")`                               |
| US-1.3 | Signed-in user remains signed in after a page refresh                | `frontend/tests/Login.test.js`    | `it("Signed-in user remains signed in after a page refresh")`                |
| US-1.4 | User signs out                                                       | `frontend/tests/MenuBar.test.js`  | `it("User signs out")`                                                       |
| US-1.5 | Guest views published recipes without signing in                     | `frontend/tests/Login.test.js`    | `it("Guest views published recipes without signing in")`                     |
| US-1.5 | Unauthenticated user is redirected from ingredients to login         | `frontend/tests/router.test.js`   | `it("Unauthenticated user is redirected from ingredients to login")`         |
| US-1.5 | Unauthenticated user is redirected from edit recipe to login         | `frontend/tests/router.test.js`   | `it("Unauthenticated user is redirected from edit recipe to login")`         |
| US-1.5 | Protected API request without a token returns 401                    | `backend/tests/user-auth.test.js` | `it("Protected API request without a token returns 401")`                    |
| US-1.5 | Protected API request with an expired token returns 401              | `backend/tests/user-auth.test.js` | `it("Protected API request with an expired token returns 401")`              |


Successful register/login redirects and snackbar copy are also asserted from `frontend/tests/Login.test.js` when those scenarios are covered on the backend for HTTP contracts.

---



## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 1 from @features/feature-1-account-management.md on branch `feature-1-account-management`.

Follow layer order in @features/framework.md (models → routes → backend tests → frontend → frontend tests).
Map every Gherkin scenario in the Test Coverage Map; run `npm test` before finishing.
If API routes, payloads, schema, or product rules changed per this spec, update @features/reference/api.md, @features/reference/data-model.md, and/or @features/reference/behavior.md in the same PR to match shipped code.
Complete Definition of Done and the merge checklist in @features/framework.md.
Do not implement behavior not in this spec.
```

**Reference updates for this feature:** `features/reference/api.md`, `features/reference/data-model.md`, `features/reference/behavior.md`

---



## Definition of Done

- [ ] Backend and frontend implemented per this spec (**FR-001**–**FR-011** satisfied)
- [ ] **Success Criteria (SC-001**–**SC-004)** met
- [ ] All mapped tests pass (`npm test`)
- [ ] Test Coverage Map complete
- [ ] `features/reference/data-model.md` updated (if schema changed)
- [ ] `features/reference/api.md` updated (if API changed)
- [ ] `features/reference/behavior.md` updated (if product rules changed)

---



## Out of Scope

- Password reset
- Username login, `role` / `worker`, bcrypt, JWT, and login session reuse (not how the Recipe app authenticates)
- Profile edit (`PUT /recipeapi/users/:id`) and other leftover user list/delete admin routes
- Ingredient CRUD ([Feature 2](./feature-2-ingredients-management.md))
- Recipe create/edit/delete ([Feature 3](./feature-3-recipe-management.md))
- Recipe steps and recipe-ingredient rows ([Feature 4](./feature-4-recipe-ingredients-management.md))
- Publish toggle and published-recipe management beyond guest **read** of `isPublished = true` ([Feature 5](./feature-5-published-recipe-management.md))



## Delivered to Feature 5

- Guest **View Published Recipes** and unauthenticated `GET /recipeapi/recipes/` are in this feature. Feature 5 owns toggling `isPublished` and any richer published-recipe UX.



## Delivered to Features 2–3

- Feature 1 only gates `/ingredients` and `/recipe/:id` behind a session. The screens themselves stay those features.

