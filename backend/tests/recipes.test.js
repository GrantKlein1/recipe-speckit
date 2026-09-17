/**
 * Feature 3 — Recipe Management
 * Spec: features/feature-3-recipe-management.md
 */

const request = require("supertest");
const app = require("../server");
const db = require("../app/models");
const {
  getSalt,
  hashPassword,
  encrypt,
} = require("../app/authentication/crypto");

async function createAuthedUser(overrides = {}) {
  const salt = await getSalt();
  const password = await hashPassword("password123", salt);
  const user = await db.user.create({
    firstName: overrides.firstName || "Test",
    lastName: overrides.lastName || "User",
    email: overrides.email || `recipe-test-${Date.now()}-${Math.random()}@example.com`,
    password,
    salt,
  });
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 1);
  const session = await db.session.create({
    email: user.email,
    userId: user.id,
    expirationDate,
  });
  const token = await encrypt(session.id);
  return { user, token };
}

function recipeBody(userId, overrides = {}) {
  return {
    name: "Pancakes",
    description: "Weekend breakfast",
    servings: 4,
    time: 20,
    isPublished: false,
    userId,
    ...overrides,
  };
}

async function createRecipe(userId, overrides = {}) {
  return db.recipe.create(recipeBody(userId, overrides));
}

describe("Feature 3 — Recipe Management", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  beforeEach(async () => {
    await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    await db.recipeIngredient.destroy({ where: {}, truncate: true });
    await db.recipeStep.destroy({ where: {}, truncate: true });
    await db.recipe.destroy({ where: {}, truncate: true });
    await db.ingredient.destroy({ where: {}, truncate: true });
    await db.session.destroy({ where: {}, truncate: true });
    await db.user.destroy({ where: {}, truncate: true });
    await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
  });

  describe("US-3.1 — Create a recipe", () => {
    it("Signed-in user adds a recipe", async () => {
      const { user, token } = await createAuthedUser();

      const res = await request(app)
        .post("/recipeapi/recipes/")
        .set("Authorization", `Bearer ${token}`)
        .send(recipeBody(user.id));

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Pancakes");
      expect(res.body.userId).toBe(user.id);
    });

    it("Create without name is rejected", async () => {
      const { user, token } = await createAuthedUser();
      const body = recipeBody(user.id);
      delete body.name;

      const res = await request(app)
        .post("/recipeapi/recipes/")
        .set("Authorization", `Bearer ${token}`)
        .send(body);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Name cannot be empty for recipe!" });
    });

    it("Create without description is rejected", async () => {
      const { user, token } = await createAuthedUser();
      const body = recipeBody(user.id);
      delete body.description;

      const res = await request(app)
        .post("/recipeapi/recipes/")
        .set("Authorization", `Bearer ${token}`)
        .send(body);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        message: "Description cannot be empty for recipe!",
      });
    });

    it("Create without servings is rejected", async () => {
      const { user, token } = await createAuthedUser();
      const body = recipeBody(user.id);
      delete body.servings;

      const res = await request(app)
        .post("/recipeapi/recipes/")
        .set("Authorization", `Bearer ${token}`)
        .send(body);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        message: "Servings cannot be empty for recipe!",
      });
    });

    it("Create without time is rejected", async () => {
      const { user, token } = await createAuthedUser();
      const body = recipeBody(user.id);
      delete body.time;

      const res = await request(app)
        .post("/recipeapi/recipes/")
        .set("Authorization", `Bearer ${token}`)
        .send(body);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Time cannot be empty for recipe!" });
    });
  });

  describe("US-3.2 — View my recipes", () => {
    it("User recipes are ordered by name", async () => {
      const { user, token } = await createAuthedUser();
      await createRecipe(user.id, { name: "Pancakes" });
      await createRecipe(user.id, { name: "Chili" });

      const res = await request(app)
        .get(`/recipeapi/recipes/user/${user.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.map((row) => row.name)).toEqual(["Chili", "Pancakes"]);
    });

    it("User only sees their own recipes on the signed-in list", async () => {
      const userA = await createAuthedUser({ email: `a-${Date.now()}@example.com` });
      const userB = await createAuthedUser({ email: `b-${Date.now()}@example.com` });
      await createRecipe(userA.user.id, { name: "My Stew" });
      await createRecipe(userB.user.id, { name: "Their Stew" });

      const res = await request(app)
        .get(`/recipeapi/recipes/user/${userA.user.id}`)
        .set("Authorization", `Bearer ${userA.token}`);

      expect(res.status).toBe(200);
      expect(res.body.map((row) => row.name)).toEqual(["My Stew"]);
      expect(res.body.some((row) => row.name === "Their Stew")).toBe(false);
    });
  });

  describe("US-3.3 — Edit a recipe", () => {
    it("Signed-in user updates a recipe", async () => {
      const { user, token } = await createAuthedUser();
      const recipe = await createRecipe(user.id, {
        name: "Pancakes",
        servings: 4,
      });

      const res = await request(app)
        .put(`/recipeapi/recipes/${recipe.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Pancakes",
          description: "Weekend breakfast",
          servings: 6,
          time: 20,
          isPublished: false,
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: "Recipe was updated successfully.",
      });

      const updated = await db.recipe.findByPk(recipe.id);
      expect(updated.servings).toBe(6);
    });
  });

  describe("US-3.5 — Private recipes only", () => {
    it("User attempts to update another user's recipe", async () => {
      const userA = await createAuthedUser({ email: `a-${Date.now()}@example.com` });
      const userB = await createAuthedUser({ email: `b-${Date.now()}@example.com` });
      const recipe = await createRecipe(userB.user.id, { name: "Secret Chili" });

      const res = await request(app)
        .put(`/recipeapi/recipes/${recipe.id}`)
        .set("Authorization", `Bearer ${userA.token}`)
        .send({ name: "Hijacked" });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: `Cannot find Recipe with id=${recipe.id}.`,
      });

      const unchanged = await db.recipe.findByPk(recipe.id);
      expect(unchanged.name).toBe("Secret Chili");
    });

    it("User attempts to delete another user's recipe", async () => {
      const userA = await createAuthedUser({ email: `a-${Date.now()}@example.com` });
      const userB = await createAuthedUser({ email: `b-${Date.now()}@example.com` });
      const recipe = await createRecipe(userB.user.id, { name: "Secret Chili" });

      const res = await request(app)
        .delete(`/recipeapi/recipes/${recipe.id}`)
        .set("Authorization", `Bearer ${userA.token}`);

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: `Cannot find Recipe with id=${recipe.id}.`,
      });

      const stillThere = await db.recipe.findByPk(recipe.id);
      expect(stillThere).not.toBeNull();
    });

    it("Unauthenticated create is rejected", async () => {
      const res = await request(app)
        .post("/recipeapi/recipes/")
        .send(recipeBody(1));

      expect(res.status).toBe(401);
    });

    it("Unauthenticated update is rejected", async () => {
      const { user } = await createAuthedUser();
      const recipe = await createRecipe(user.id);

      const res = await request(app)
        .put(`/recipeapi/recipes/${recipe.id}`)
        .send({ name: "Hijacked" });

      expect(res.status).toBe(401);
    });
  });

  describe("US-3.6 — Nested recipe data is removed with the recipe", () => {
    it("Deleting a recipe removes its steps and recipe ingredients", async () => {
      const { user, token } = await createAuthedUser();
      const recipe = await createRecipe(user.id, { name: "Pancakes" });
      const ingredient = await db.ingredient.create({
        name: "Flour",
        unit: "cup",
        pricePerUnit: 0.45,
      });
      const step = await db.recipeStep.create({
        stepNumber: 1,
        instruction: "Mix the batter",
        recipeId: recipe.id,
      });
      await db.recipeIngredient.create({
        quantity: 1,
        recipeId: recipe.id,
        recipeStepId: step.id,
        ingredientId: ingredient.id,
      });

      const res = await request(app)
        .delete(`/recipeapi/recipes/${recipe.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: "Recipe was deleted successfully!",
      });

      expect(await db.recipe.findByPk(recipe.id)).toBeNull();
      expect(await db.recipeStep.count({ where: { recipeId: recipe.id } })).toBe(
        0
      );
      expect(
        await db.recipeIngredient.count({ where: { recipeId: recipe.id } })
      ).toBe(0);
    });
  });
});
