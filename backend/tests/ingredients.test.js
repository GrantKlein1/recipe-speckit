/**
 * Feature 2 — Ingredients Management
 * Spec: features/feature-2-ingredients-management.md
 */

const request = require("supertest");
const app = require("../server");
const db = require("../app/models");
const { getSalt, hashPassword, encrypt } = require("../app/authentication/crypto");

async function createAuthedUser() {
  const salt = await getSalt();
  const password = await hashPassword("password123", salt);
  const user = await db.user.create({
    firstName: "Test",
    lastName: "User",
    email: `ingredient-test-${Date.now()}@example.com`,
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

describe("Feature 2 — Ingredients Management", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  beforeEach(async () => {
    await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    await db.ingredient.destroy({ where: {}, truncate: true });
    await db.session.destroy({ where: {}, truncate: true });
    await db.user.destroy({ where: {}, truncate: true });
    await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
  });

  describe("US-2.1 — View ingredients", () => {
    it("Ingredients list is ordered by name", async () => {
      await db.ingredient.create({
        name: "Sugar",
        unit: "cup",
        pricePerUnit: 0.3,
      });
      await db.ingredient.create({
        name: "Butter",
        unit: "tablespoon",
        pricePerUnit: 0.2,
      });

      const res = await request(app).get("/recipeapi/ingredients/");

      expect(res.status).toBe(200);
      expect(res.body.map((row) => row.name)).toEqual(["Butter", "Sugar"]);
    });

    it("Guest can view ingredients without signing in", async () => {
      await db.ingredient.create({
        name: "Flour",
        unit: "cup",
        pricePerUnit: 0.45,
      });

      const res = await request(app).get("/recipeapi/ingredients/");

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].name).toBe("Flour");
    });
  });

  describe("US-2.2 — Add an ingredient", () => {
    it("Signed-in user adds an ingredient", async () => {
      const { token } = await createAuthedUser();

      const res = await request(app)
        .post("/recipeapi/ingredients/")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Olive Oil",
          unit: "tablespoon",
          pricePerUnit: 0.1,
        });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Olive Oil");
      expect(res.body.unit).toBe("tablespoon");
      expect(Number(res.body.pricePerUnit)).toBeCloseTo(0.1);

      const listed = await request(app).get("/recipeapi/ingredients/");
      expect(listed.body.some((row) => row.name === "Olive Oil")).toBe(true);
    });
  });

  describe("US-2.3 — Edit an ingredient", () => {
    it("Signed-in user updates an ingredient", async () => {
      const { token } = await createAuthedUser();
      const flour = await db.ingredient.create({
        name: "Flour",
        unit: "cup",
        pricePerUnit: 0.45,
      });

      const res = await request(app)
        .put(`/recipeapi/ingredients/${flour.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Flour",
          unit: "cup",
          pricePerUnit: 0.5,
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Ingredient was updated successfully.");

      const updated = await db.ingredient.findByPk(flour.id);
      expect(Number(updated.pricePerUnit)).toBeCloseTo(0.5);
    });
  });

  describe("US-2.4 — Writes require a session", () => {
    it("Unauthenticated create is rejected", async () => {
      const res = await request(app).post("/recipeapi/ingredients/").send({
        name: "Salt",
        unit: "teaspoon",
        pricePerUnit: 0.05,
      });

      expect(res.status).toBe(401);
    });

    it("Unauthenticated update is rejected", async () => {
      const ingredient = await db.ingredient.create({
        name: "Flour",
        unit: "cup",
        pricePerUnit: 0.45,
      });

      const res = await request(app)
        .put(`/recipeapi/ingredients/${ingredient.id}`)
        .send({ name: "Hijacked" });

      expect(res.status).toBe(401);
    });
  });

  describe("US-2.5 — Validate ingredient fields", () => {
    it("Create without name is rejected", async () => {
      const { token } = await createAuthedUser();

      const res = await request(app)
        .post("/recipeapi/ingredients/")
        .set("Authorization", `Bearer ${token}`)
        .send({
          unit: "cup",
          pricePerUnit: 0.45,
        });

      expect(res.status).toBe(400);
      expect(res.body.message.toLowerCase()).toContain("name");
    });

    it("Create without unit is rejected", async () => {
      const { token } = await createAuthedUser();

      const res = await request(app)
        .post("/recipeapi/ingredients/")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Flour",
          pricePerUnit: 0.45,
        });

      expect(res.status).toBe(400);
      expect(res.body.message.toLowerCase()).toContain("unit");
    });

    it("Create without price per unit is rejected", async () => {
      const { token } = await createAuthedUser();

      const res = await request(app)
        .post("/recipeapi/ingredients/")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Flour",
          unit: "cup",
        });

      expect(res.status).toBe(400);
      expect(res.body.message.toLowerCase()).toMatch(/price/);
    });
  });
});
