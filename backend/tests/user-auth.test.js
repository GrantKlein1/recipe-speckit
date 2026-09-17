/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-account-management.md
 */

const request = require("supertest");
const app = require("../server");
const db = require("../app/models");

const REGISTER_PATH = "/recipeapi/users/";
const LOGIN_PATH = "/recipeapi/login";
const USER_RECIPES_PATH = "/recipeapi/recipes/user/1";

const validUser = {
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@example.com",
  password: "secret123",
};

function basicAuth(email, password) {
  const credentials = Buffer.from(`${email}:${password}`).toString("base64");
  return `Basic ${credentials}`;
}

async function registerUser(overrides = {}) {
  return request(app)
    .post(REGISTER_PATH)
    .send({ ...validUser, ...overrides });
}

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await db.sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe("US-1.1 — Register an account", () => {
    it("User registers with valid first name, last name, email, and password", async () => {
      const res = await registerUser();

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        email: validUser.email,
        firstName: validUser.firstName,
        lastName: validUser.lastName,
      });
      expect(res.body.id).toEqual(expect.any(Number));
      expect(res.body.token).toEqual(expect.any(String));
      expect(res.body.token.length).toBeGreaterThan(0);
      expect(res.body.password).toBeUndefined();
      expect(res.body.salt).toBeUndefined();
      expect(Object.keys(res.body).sort()).toEqual(
        ["email", "firstName", "id", "lastName", "token"].sort()
      );

      const sessions = await db.session.findAll({ where: { userId: res.body.id } });
      expect(sessions).toHaveLength(1);
    });

    it("User registers with a duplicate email", async () => {
      const first = await registerUser();
      expect(first.status).toBe(200);

      const res = await registerUser();

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "This email is already in use." });
    });

    it("User registers with a missing required field", async () => {
      const cases = [
        ["firstName", "First name cannot be empty for user!"],
        ["lastName", "Last name cannot be empty for user!"],
        ["email", "Email cannot be empty for user!"],
        ["password", "Password cannot be empty for user!"],
      ];

      for (const [field, message] of cases) {
        const body = { ...validUser, email: `missing-${field}@example.com` };
        delete body[field];

        const res = await request(app).post(REGISTER_PATH).send(body);

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ message });
      }
    });
  });

  describe("US-1.2 — Sign in", () => {
    it("User signs in with valid email and password", async () => {
      const registered = await registerUser();
      expect(registered.status).toBe(200);

      const sessionCountBefore = await db.session.count({
        where: { userId: registered.body.id },
      });

      const res = await request(app)
        .post(LOGIN_PATH)
        .set("Authorization", basicAuth(validUser.email, validUser.password));

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        email: validUser.email,
        firstName: validUser.firstName,
        lastName: validUser.lastName,
        id: registered.body.id,
      });
      expect(res.body.token).toEqual(expect.any(String));
      expect(res.body.token).not.toBe(registered.body.token);
      expect(res.body.password).toBeUndefined();
      expect(res.body.salt).toBeUndefined();

      const sessionCountAfter = await db.session.count({
        where: { userId: registered.body.id },
      });
      expect(sessionCountAfter).toBe(sessionCountBefore + 1);
    });

    it("User signs in with an unknown email", async () => {
      const res = await request(app)
        .post(LOGIN_PATH)
        .set("Authorization", basicAuth("missing@example.com", "any-password"));

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: "User not found!" });
    });

    it("User signs in with an invalid password", async () => {
      const registered = await registerUser();
      expect(registered.status).toBe(200);

      const res = await request(app)
        .post(LOGIN_PATH)
        .set("Authorization", basicAuth(validUser.email, "wrong-password"));

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: "Invalid password!" });
    });
  });

  describe("US-1.5 — Guard private screens; allow guest published recipes", () => {
    it("Protected API request without a token returns 401", async () => {
      const res = await request(app).get(USER_RECIPES_PATH);

      expect(res.status).toBe(401);
    });

    it("Protected API request with an expired token returns 401", async () => {
      const registered = await registerUser();
      expect(registered.status).toBe(200);

      await db.session.update(
        { expirationDate: new Date(Date.now() - 60 * 1000) },
        { where: { userId: registered.body.id } }
      );

      const res = await request(app)
        .get(`/recipeapi/recipes/user/${registered.body.id}`)
        .set("Authorization", `Bearer ${registered.body.token}`);

      expect(res.status).toBe(401);
    });
  });
});
