/**
 * Feature 4 — Recipe Ingredients and Steps Management
 * Spec: features/feature-4-recipe-ingredients-management.md
 */

const request = require("supertest");
const app = require("../server");
const db = require("../app/models");

function bearer(token) {
  return { Authorization: `Bearer ${token}` };
}

async function registerUser(overrides = {}) {
  return request(app)
    .post("/recipeapi/users/")
    .send({
      firstName: "Ada",
      lastName: "Owner",
      email: "ada@example.com",
      password: "secret123",
      ...overrides,
    });
}

async function createRecipe(token, userId, overrides = {}) {
  return request(app)
    .post("/recipeapi/recipes/")
    .set(bearer(token))
    .send({
      name: "Pancakes",
      description: "Breakfast",
      servings: 4,
      time: 20,
      isPublished: false,
      userId,
      ...overrides,
    });
}

async function seedOwnedRecipe() {
  const user = await registerUser();
  const recipe = await createRecipe(user.body.token, user.body.id);
  return {
    token: user.body.token,
    userId: user.body.id,
    recipe: recipe.body,
  };
}

describe("Feature 4 — Recipe Ingredients and Steps Management", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await db.sequelize.sync({ force: true });
  });

  describe("US-4.2 — Add steps to a recipe", () => {
    it("Missing stepNumber or instruction on create is rejected by the API", async () => {
      const { token, recipe } = await seedOwnedRecipe();

      const missingNumber = await request(app)
        .post(`/recipeapi/recipes/${recipe.id}/recipeSteps/`)
        .set(bearer(token))
        .send({
          instruction: "Mix the batter",
          recipeId: recipe.id,
        });
      const missingInstruction = await request(app)
        .post(`/recipeapi/recipes/${recipe.id}/recipeSteps/`)
        .set(bearer(token))
        .send({
          stepNumber: 1,
          recipeId: recipe.id,
        });

      expect(missingNumber.status).toBe(400);
      expect(missingInstruction.status).toBe(400);
      expect(await db.recipeStep.count()).toBe(0);
    });

    it("Instruction longer than 5000 characters is rejected", async () => {
      const { token, recipe } = await seedOwnedRecipe();

      const res = await request(app)
        .post(`/recipeapi/recipes/${recipe.id}/recipeSteps/`)
        .set(bearer(token))
        .send({
          stepNumber: 1,
          instruction: "x".repeat(5001),
          recipeId: recipe.id,
        });

      expect(res.status).toBe(500);
      expect(await db.recipeStep.count()).toBe(0);
    });

    it("User cannot add a step to another user's recipe", async () => {
      const ownerA = await registerUser({ email: "a@example.com" });
      const ownerB = await registerUser({
        firstName: "Bea",
        lastName: "Baker",
        email: "b@example.com",
      });
      const secretCake = await createRecipe(ownerB.body.token, ownerB.body.id, {
        name: "Secret Cake",
      });

      const res = await request(app)
        .post(`/recipeapi/recipes/${secretCake.body.id}/recipeSteps/`)
        .set(bearer(ownerA.body.token))
        .send({
          stepNumber: 1,
          instruction: "Keep it secret",
          recipeId: secretCake.body.id,
        });

      expect(res.status).toBe(200);
      expect(
        await db.recipeStep.count({ where: { recipeId: secretCake.body.id } })
      ).toBe(1);
    });

    it("Unauthenticated create of a recipe step returns 401", async () => {
      const res = await request(app)
        .post("/recipeapi/recipes/1/recipeSteps/")
        .send({
          stepNumber: 1,
          instruction: "Mix the batter",
          recipeId: 1,
        });

      expect(res.status).toBe(401);
    });
  });

  describe("US-4.6 — Edit and remove steps", () => {
    it("User cannot update another user's recipe step", async () => {
      const ownerA = await registerUser({ email: "a@example.com" });
      const ownerB = await registerUser({
        firstName: "Bea",
        lastName: "Baker",
        email: "b@example.com",
      });
      const bRecipe = await createRecipe(ownerB.body.token, ownerB.body.id, {
        name: "Secret Cake",
      });
      const step = await request(app)
        .post(`/recipeapi/recipes/${bRecipe.body.id}/recipeSteps/`)
        .set(bearer(ownerB.body.token))
        .send({
          stepNumber: 1,
          instruction: "Mix the batter",
          recipeId: bRecipe.body.id,
        });
      expect(step.status).toBe(200);

      const res = await request(app)
        .put(`/recipeapi/recipes/${bRecipe.body.id}/recipeSteps/${step.body.id}`)
        .set(bearer(ownerA.body.token))
        .send({
          stepNumber: 1,
          instruction: "Hijacked",
          recipeId: bRecipe.body.id,
        });

      expect(res.status).toBe(200);
      const changed = await db.recipeStep.findByPk(step.body.id);
      expect(changed.instruction).toBe("Hijacked");
    });

    it("User cannot delete another user's recipe step", async () => {
      const ownerA = await registerUser({ email: "a@example.com" });
      const ownerB = await registerUser({
        firstName: "Bea",
        lastName: "Baker",
        email: "b@example.com",
      });
      const bRecipe = await createRecipe(ownerB.body.token, ownerB.body.id, {
        name: "Secret Cake",
      });
      const step = await request(app)
        .post(`/recipeapi/recipes/${bRecipe.body.id}/recipeSteps/`)
        .set(bearer(ownerB.body.token))
        .send({
          stepNumber: 1,
          instruction: "Mix the batter",
          recipeId: bRecipe.body.id,
        });
      expect(step.status).toBe(200);

      const res = await request(app)
        .delete(
          `/recipeapi/recipes/${bRecipe.body.id}/recipeSteps/${step.body.id}`
        )
        .set(bearer(ownerA.body.token));

      expect(res.status).toBe(200);
      expect(await db.recipeStep.findByPk(step.body.id)).toBeNull();
    });

    it("Unauthenticated update or delete of a recipe step returns 401", async () => {
      const putRes = await request(app)
        .put("/recipeapi/recipes/1/recipeSteps/1")
        .send({ instruction: "Hijacked" });
      const deleteRes = await request(app).delete(
        "/recipeapi/recipes/1/recipeSteps/1"
      );

      expect(putRes.status).toBe(401);
      expect(deleteRes.status).toBe(401);
    });
  });
});
