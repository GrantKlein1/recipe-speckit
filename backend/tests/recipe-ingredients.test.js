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

async function createCatalogIngredient(token, overrides = {}) {
  return request(app)
    .post("/recipeapi/ingredients/")
    .set(bearer(token))
    .send({
      name: "Flour",
      unit: "cup",
      pricePerUnit: "1.50",
      ...overrides,
    });
}

async function seedOwnedRecipeWithFlour() {
  const user = await registerUser();
  const recipe = await createRecipe(user.body.token, user.body.id);
  const flour = await createCatalogIngredient(user.body.token);
  return {
    token: user.body.token,
    userId: user.body.id,
    recipe: recipe.body,
    flour: flour.body,
  };
}

describe("Feature 4 — Recipe Ingredients and Steps Management", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await db.sequelize.sync({ force: true });
  });

  describe("US-4.1 — Add ingredients to a recipe", () => {
    it("Missing quantity on create is rejected by the API", async () => {
      const { token, recipe, flour } = await seedOwnedRecipeWithFlour();

      const res = await request(app)
        .post(`/recipeapi/recipes/${recipe.id}/recipeIngredients/`)
        .set(bearer(token))
        .send({
          ingredientId: flour.id,
          recipeId: recipe.id,
        })
        .timeout(2000);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        message: "Quantity cannot be empty for recipe ingredient!",
      });
      expect(await db.recipeIngredient.count()).toBe(0);
    });

    it("Missing ingredientId on create is rejected by the API", async () => {
      const { token, recipe } = await seedOwnedRecipeWithFlour();

      const res = await request(app)
        .post(`/recipeapi/recipes/${recipe.id}/recipeIngredients/`)
        .set(bearer(token))
        .send({
          quantity: 2,
          recipeId: recipe.id,
        })
        .timeout(2000);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        message: "Ingredient ID cannot be empty for recipe ingredient!",
      });
      expect(await db.recipeIngredient.count()).toBe(0);
    });

    it("Unknown catalog ingredientId is rejected", async () => {
      const { token, recipe } = await seedOwnedRecipeWithFlour();
      const catalogCount = await db.ingredient.count();

      const res = await request(app)
        .post(`/recipeapi/recipes/${recipe.id}/recipeIngredients/`)
        .set(bearer(token))
        .send({
          quantity: 2,
          ingredientId: 99999,
          recipeId: recipe.id,
        });

      expect([400, 404]).toContain(res.status);
      expect(await db.recipeIngredient.count()).toBe(0);
      expect(await db.ingredient.count()).toBe(catalogCount);
    });

    it("Recipe ingredient is stored without a step when recipeStepId is omitted", async () => {
      const { token, recipe, flour } = await seedOwnedRecipeWithFlour();

      const res = await request(app)
        .post(`/recipeapi/recipes/${recipe.id}/recipeIngredients/`)
        .set(bearer(token))
        .send({
          quantity: 2,
          ingredientId: flour.id,
          recipeId: recipe.id,
        });

      expect(res.status).toBe(200);
      expect(res.body.recipeStepId).toBeNull();
      const row = await db.recipeIngredient.findByPk(res.body.id);
      expect(row.recipeStepId).toBeNull();
    });

    it("User cannot add an ingredient to another user's recipe", async () => {
      const ownerA = await registerUser({ email: "a@example.com" });
      const ownerB = await registerUser({
        firstName: "Bea",
        lastName: "Baker",
        email: "b@example.com",
      });
      const secretCake = await createRecipe(ownerB.body.token, ownerB.body.id, {
        name: "Secret Cake",
      });
      const flour = await createCatalogIngredient(ownerA.body.token);

      const res = await request(app)
        .post(`/recipeapi/recipes/${secretCake.body.id}/recipeIngredients/`)
        .set(bearer(ownerA.body.token))
        .send({
          quantity: 1,
          ingredientId: flour.body.id,
          recipeId: secretCake.body.id,
        });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: `Cannot find Recipe with id=${secretCake.body.id}.`,
      });
      expect(
        await db.recipeIngredient.count({
          where: { recipeId: secretCake.body.id },
        })
      ).toBe(0);
    });

    it("Client cannot assign a recipe ingredient to another user on create", async () => {
      const { token, userId, recipe, flour } = await seedOwnedRecipeWithFlour();

      const res = await request(app)
        .post(`/recipeapi/recipes/${recipe.id}/recipeIngredients/`)
        .set(bearer(token))
        .send({
          quantity: 2,
          ingredientId: flour.id,
          recipeId: recipe.id,
          userId: 999,
        });

      expect(res.status).toBe(200);
      expect(res.body.recipeId).toBe(recipe.id);
      expect(res.body.userId).toBeUndefined();
      const row = await db.recipeIngredient.findByPk(res.body.id);
      expect(row.recipeId).toBe(recipe.id);
      expect(row.dataValues.userId).toBeUndefined();
      const parent = await db.recipe.findByPk(row.recipeId);
      expect(parent.userId).toBe(userId);
    });

    it("Unauthenticated create of a recipe ingredient returns 401", async () => {
      const res = await request(app)
        .post("/recipeapi/recipes/1/recipeIngredients/")
        .send({
          quantity: 2,
          ingredientId: 1,
          recipeId: 1,
        });

      expect(res.status).toBe(401);
    });
  });

  describe("US-4.5 — Edit and remove ingredients", () => {
    it("Catalog ingredient remains after deleting a recipe line", async () => {
      const { token, recipe, flour } = await seedOwnedRecipeWithFlour();
      const created = await request(app)
        .post(`/recipeapi/recipes/${recipe.id}/recipeIngredients/`)
        .set(bearer(token))
        .send({
          quantity: 2,
          ingredientId: flour.id,
          recipeId: recipe.id,
        });
      expect(created.status).toBe(200);

      const res = await request(app)
        .delete(
          `/recipeapi/recipes/${recipe.id}/recipeIngredients/${created.body.id}`
        )
        .set(bearer(token));

      expect(res.status).toBe(200);
      expect(await db.recipeIngredient.count()).toBe(0);
      const catalog = await db.ingredient.findByPk(flour.id);
      expect(catalog).not.toBeNull();
      expect(catalog.name).toBe("Flour");
    });

    it("User cannot update another user's recipe ingredient", async () => {
      const ownerA = await registerUser({ email: "a@example.com" });
      const ownerB = await registerUser({
        firstName: "Bea",
        lastName: "Baker",
        email: "b@example.com",
      });
      const bRecipe = await createRecipe(ownerB.body.token, ownerB.body.id, {
        name: "Secret Cake",
      });
      const flour = await createCatalogIngredient(ownerB.body.token);
      const line = await request(app)
        .post(`/recipeapi/recipes/${bRecipe.body.id}/recipeIngredients/`)
        .set(bearer(ownerB.body.token))
        .send({
          quantity: 2,
          ingredientId: flour.body.id,
          recipeId: bRecipe.body.id,
        });
      expect(line.status).toBe(200);

      const res = await request(app)
        .put(
          `/recipeapi/recipes/${bRecipe.body.id}/recipeIngredients/${line.body.id}`
        )
        .set(bearer(ownerA.body.token))
        .send({
          quantity: 9,
          ingredientId: flour.body.id,
          recipeId: bRecipe.body.id,
        });

      expect(res.status).toBe(404);
      const unchanged = await db.recipeIngredient.findByPk(line.body.id);
      expect(Number(unchanged.quantity)).toBe(2);
    });

    it("User cannot delete another user's recipe ingredient", async () => {
      const ownerA = await registerUser({ email: "a@example.com" });
      const ownerB = await registerUser({
        firstName: "Bea",
        lastName: "Baker",
        email: "b@example.com",
      });
      const bRecipe = await createRecipe(ownerB.body.token, ownerB.body.id, {
        name: "Secret Cake",
      });
      const flour = await createCatalogIngredient(ownerB.body.token);
      const line = await request(app)
        .post(`/recipeapi/recipes/${bRecipe.body.id}/recipeIngredients/`)
        .set(bearer(ownerB.body.token))
        .send({
          quantity: 2,
          ingredientId: flour.body.id,
          recipeId: bRecipe.body.id,
        });
      expect(line.status).toBe(200);

      const res = await request(app)
        .delete(
          `/recipeapi/recipes/${bRecipe.body.id}/recipeIngredients/${line.body.id}`
        )
        .set(bearer(ownerA.body.token));

      expect(res.status).toBe(404);
      expect(await db.recipeIngredient.findByPk(line.body.id)).not.toBeNull();
    });

    it("Unauthenticated update or delete of a recipe ingredient returns 401", async () => {
      const putRes = await request(app)
        .put("/recipeapi/recipes/1/recipeIngredients/1")
        .send({ quantity: 3 });
      const deleteRes = await request(app).delete(
        "/recipeapi/recipes/1/recipeIngredients/1"
      );

      expect(putRes.status).toBe(401);
      expect(deleteRes.status).toBe(401);
    });
  });

  describe("US-4.7 — recipes carry their steps", () => {
    it("Deleting a recipe removes its steps and recipe ingredients", async () => {
      const { token, recipe, flour } = await seedOwnedRecipeWithFlour();
      const line = await request(app)
        .post(`/recipeapi/recipes/${recipe.id}/recipeIngredients/`)
        .set(bearer(token))
        .send({
          quantity: 2,
          ingredientId: flour.id,
          recipeId: recipe.id,
        });
      const step = await request(app)
        .post(`/recipeapi/recipes/${recipe.id}/recipeSteps/`)
        .set(bearer(token))
        .send({
          stepNumber: 1,
          instruction: "Mix the batter",
          recipeId: recipe.id,
        });
      expect(line.status).toBe(200);
      expect(step.status).toBe(200);

      const res = await request(app)
        .delete(`/recipeapi/recipes/${recipe.id}`)
        .set(bearer(token));

      expect(res.status).toBe(200);
      expect(
        await db.recipeStep.count({ where: { recipeId: recipe.id } })
      ).toBe(0);
      expect(
        await db.recipeIngredient.count({ where: { recipeId: recipe.id } })
      ).toBe(0);
      const catalog = await db.ingredient.findByPk(flour.id);
      expect(catalog).not.toBeNull();
      expect(catalog.name).toBe("Flour");
    });
  });
});
