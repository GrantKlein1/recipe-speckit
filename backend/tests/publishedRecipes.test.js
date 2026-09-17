/**
 * Feature 5 — Published Recipe Management
 * Spec: features/feature-5-published-recipe-management.md
 */

const request = require("supertest");
const db = require("../app/models");
const app = require("../server");

async function cleanDatabase() {
  await db.recipeIngredient.destroy({ where: {}, force: true });
  await db.recipeStep.destroy({ where: {}, force: true });
  await db.recipe.destroy({ where: {}, force: true });
  await db.session.destroy({ where: {}, force: true });
  await db.user.destroy({ where: {}, force: true });
  await db.ingredient.destroy({ where: {}, force: true });
}

async function createUser(overrides = {}) {
  const payload = {
    firstName: overrides.firstName || "Test",
    lastName: overrides.lastName || "User",
    email: overrides.email || `user-${Date.now()}-${Math.random()}@example.com`,
    password: overrides.password || "password123",
  };
  const res = await request(app).post("/recipeapi/users/").send(payload);
  expect(res.status).toBe(200);
  return { ...res.body, password: payload.password };
}

async function createRecipe(token, body) {
  return request(app)
    .post("/recipeapi/recipes/")
    .set("Authorization", `Bearer ${token}`)
    .send(body);
}

describe("Feature 5 — Published Recipe Management", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe("US-5.1 — Publish or unpublish from edit recipe", () => {
    it("Owner publishes a recipe", async () => {
      const owner = await createUser({ email: "owner-publish@example.com" });
      const createRes = await createRecipe(owner.token, {
        name: "Pasta Primavera",
        description: "Spring vegetables over pasta",
        servings: 4,
        time: 30,
        isPublished: false,
        userId: owner.id,
      });
      expect(createRes.status).toBe(200);
      const recipeId = createRes.body.id;

      const updateRes = await request(app)
        .put(`/recipeapi/recipes/${recipeId}`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          name: "Pasta Primavera",
          description: "Spring vegetables over pasta",
          servings: 4,
          time: 30,
          isPublished: true,
          userId: owner.id,
        });
      expect(updateRes.status).toBe(200);

      const stored = await db.recipe.findByPk(recipeId);
      expect(stored.isPublished).toBe(true);

      const publicRes = await request(app).get("/recipeapi/recipes");
      expect(publicRes.status).toBe(200);
      expect(publicRes.body.map((r) => r.name)).toContain("Pasta Primavera");
    });

    it("Owner unpublishes a recipe", async () => {
      const owner = await createUser({ email: "owner-unpublish@example.com" });
      const createRes = await createRecipe(owner.token, {
        name: "Pasta Primavera",
        description: "Spring vegetables over pasta",
        servings: 4,
        time: 30,
        isPublished: true,
        userId: owner.id,
      });
      expect(createRes.status).toBe(200);
      const recipeId = createRes.body.id;

      const updateRes = await request(app)
        .put(`/recipeapi/recipes/${recipeId}`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          name: "Pasta Primavera",
          description: "Spring vegetables over pasta",
          servings: 4,
          time: 30,
          isPublished: false,
          userId: owner.id,
        });
      expect(updateRes.status).toBe(200);

      const stored = await db.recipe.findByPk(recipeId);
      expect(stored.isPublished).toBe(false);

      const publicRes = await request(app).get("/recipeapi/recipes");
      expect(publicRes.status).toBe(200);
      expect(publicRes.body.map((r) => r.name)).not.toContain("Pasta Primavera");
    });
  });

  describe("US-5.2 — Choose publish when creating a recipe", () => {
    it("User creates a published recipe", async () => {
      const owner = await createUser({ email: "create-published@example.com" });
      const createRes = await createRecipe(owner.token, {
        name: "Published Chili",
        description: "Spicy chili",
        servings: 6,
        time: 45,
        isPublished: true,
        userId: owner.id,
      });
      expect(createRes.status).toBe(200);
      expect(createRes.body.isPublished).toBe(true);

      const publicRes = await request(app).get("/recipeapi/recipes");
      expect(publicRes.status).toBe(200);
      expect(publicRes.body.map((r) => r.name)).toContain("Published Chili");
    });

    it("User creates a private recipe by default", async () => {
      const owner = await createUser({ email: "create-private@example.com" });
      const createRes = await createRecipe(owner.token, {
        name: "Private Stew",
        description: "Not shared yet",
        servings: 2,
        time: 20,
        isPublished: false,
        userId: owner.id,
      });
      expect(createRes.status).toBe(200);
      expect(createRes.body.isPublished).toBe(false);

      const publicRes = await request(app).get("/recipeapi/recipes");
      expect(publicRes.status).toBe(200);
      expect(publicRes.body.map((r) => r.name)).not.toContain("Private Stew");
    });
  });

  describe("US-5.5 — Unpublished recipes stay off the public list", () => {
    it("Public list excludes unpublished recipes", async () => {
      const userA = await createUser({
        firstName: "Alice",
        email: "alice-public@example.com",
      });
      await createRecipe(userA.token, {
        name: "Shared Soup",
        description: "Public soup",
        servings: 4,
        time: 25,
        isPublished: true,
        userId: userA.id,
      });
      await createRecipe(userA.token, {
        name: "Secret Cake",
        description: "Private cake",
        servings: 8,
        time: 60,
        isPublished: false,
        userId: userA.id,
      });

      const publicRes = await request(app).get("/recipeapi/recipes");
      expect(publicRes.status).toBe(200);
      const names = publicRes.body.map((r) => r.name);
      expect(names).toContain("Shared Soup");
      expect(names).not.toContain("Secret Cake");
    });
  });

  describe("US-5.6 — Only the owner can change publish state", () => {
    it("User cannot publish another user’s recipe", async () => {
      const userA = await createUser({
        firstName: "A",
        email: "user-a@example.com",
      });
      const userB = await createUser({
        firstName: "B",
        email: "user-b@example.com",
      });
      const createRes = await createRecipe(userB.token, {
        name: "B's Recipe",
        description: "Owned by B",
        servings: 2,
        time: 15,
        isPublished: false,
        userId: userB.id,
      });
      expect(createRes.status).toBe(200);
      const recipeId = createRes.body.id;

      const hijack = await request(app)
        .put(`/recipeapi/recipes/${recipeId}`)
        .set("Authorization", `Bearer ${userA.token}`)
        .send({ isPublished: true });
      expect(hijack.status).toBe(404);
      expect(hijack.body.message).toMatch(/cannot find|not found/i);

      const stored = await db.recipe.findByPk(recipeId);
      expect(stored.isPublished).toBe(false);
    });

    it("Unauthenticated user cannot update publish state", async () => {
      const owner = await createUser({ email: "auth-required@example.com" });
      const createRes = await createRecipe(owner.token, {
        name: "Guarded Recipe",
        description: "Needs auth to update",
        servings: 2,
        time: 10,
        isPublished: false,
        userId: owner.id,
      });
      expect(createRes.status).toBe(200);
      const recipeId = createRes.body.id;

      const res = await request(app)
        .put(`/recipeapi/recipes/${recipeId}`)
        .send({ isPublished: true });
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/unauthorized|auth/i);
    });
  });
});
