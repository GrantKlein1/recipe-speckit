/**
 * Feature 6 — Download Recipe as a PDF
 * Spec: features/feature-6-download-recipe-pdf
 */

import { flushPromises, mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RecipeList from "../src/views/RecipeList.vue";
import RecipeReports from "../src/reports/RecipeReports.js";

if (!window.matchMedia) {
  window.matchMedia = () => ({
    matches: false,
    media: "",
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
if (!globalThis.CSS) {
  globalThis.CSS = { supports: () => false };
}

const push = vi.fn();

vi.mock("vue-router", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useRoute: () => ({ name: "recipes", params: {} }),
    useRouter: () => ({ push }),
  };
});

const { mockDoc, RecipeServices, RecipeIngredientServices, RecipeStepServices } =
  vi.hoisted(() => {
    const mockDoc = {
      addImage: vi.fn(),
      setFontSize: vi.fn().mockReturnThis(),
      text: vi.fn().mockReturnThis(),
      autoTable: vi.fn(),
      save: vi.fn(),
      internal: { pageSize: { height: 11 } },
    };
    return {
      mockDoc,
      RecipeServices: {
        getRecipesByUserId: vi.fn(),
        getRecipes: vi.fn(),
      },
      RecipeIngredientServices: {
        getRecipeIngredientsForRecipe: vi.fn(),
      },
      RecipeStepServices: {
        getRecipeStepsForRecipeWithIngredients: vi.fn(),
      },
    };
  });

vi.mock("jspdf", () => ({
  default: vi.fn(function JsPDF() {
    return mockDoc;
  }),
}));
vi.mock("jspdf-autotable", () => ({}));

vi.mock("../src/services/RecipeServices.js", () => ({
  default: RecipeServices,
}));
vi.mock("../src/services/RecipeIngredientServices.js", () => ({
  default: RecipeIngredientServices,
}));
vi.mock("../src/services/RecipeIngredientServices", () => ({
  default: RecipeIngredientServices,
}));
vi.mock("../src/services/RecipeStepServices.js", () => ({
  default: RecipeStepServices,
}));
vi.mock("../src/services/RecipeStepServices", () => ({
  default: RecipeStepServices,
}));

const pancakes = {
  id: 1,
  name: "Pancakes",
  servings: 4,
  time: 20,
  description: "Breakfast",
  isPublished: false,
};

const flourLine = {
  id: 10,
  quantity: 2,
  recipeId: 1,
  ingredientId: 1,
  recipeStepId: 20,
  ingredient: {
    id: 1,
    name: "Flour",
    unit: "cup",
    pricePerUnit: "1.50",
  },
};

const mixStep = {
  id: 20,
  stepNumber: 1,
  instruction: "Mix the batter",
  recipeId: 1,
  recipeIngredient: [flourLine],
};

function makeVuetify() {
  return createVuetify({ components, directives });
}

function pdfIcon(wrapper) {
  return wrapper
    .findAllComponents({ name: "VIcon" })
    .find((icon) => icon.props("icon") === "mdi-file-pdf-box");
}

function textCalls() {
  return mockDoc.text.mock.calls.map((args) => String(args[0]));
}

async function mountRecipes() {
  const wrapper = mount(RecipeList, {
    global: { plugins: [makeVuetify()] },
  });
  await flushPromises();
  return wrapper;
}

describe("Feature 6 — Download Recipe as a PDF", () => {
  let wrapper;

  beforeEach(() => {
    localStorage.clear();
    push.mockReset();
    vi.clearAllMocks();
    mockDoc.setFontSize.mockReturnThis();
    mockDoc.text.mockReturnThis();
    RecipeIngredientServices.getRecipeIngredientsForRecipe.mockResolvedValue({
      data: [flourLine],
    });
    RecipeStepServices.getRecipeStepsForRecipeWithIngredients.mockResolvedValue(
      { data: [mixStep] }
    );
  });

  afterEach(() => {
    wrapper?.unmount();
    document.body.innerHTML = "";
    localStorage.clear();
  });

  describe("US-6.1 — Download a recipe as a PDF", () => {
    it("Signed-in user downloads an existing recipe as a PDF", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({ id: 1, token: "test-token", firstName: "Jane" })
      );
      RecipeServices.getRecipesByUserId.mockResolvedValue({
        data: [pancakes],
      });

      wrapper = await mountRecipes();

      const icon = pdfIcon(wrapper);
      expect(icon).toBeTruthy();
      await icon.trigger("click");
      await flushPromises();

      expect(mockDoc.save).toHaveBeenCalled();
      expect(push).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Recipes");
      expect(wrapper.text()).toContain("Pancakes");
    });

    it("Guest cannot download a recipe PDF", async () => {
      RecipeServices.getRecipes.mockResolvedValue({
        data: [{ ...pancakes, isPublished: true }],
      });

      wrapper = await mountRecipes();

      expect(wrapper.text()).toContain("Pancakes");
      expect(pdfIcon(wrapper)).toBeUndefined();
      expect(mockDoc.save).not.toHaveBeenCalled();
    });

    it("Signed-in user with no recipes cannot download a PDF", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({ id: 1, token: "test-token", firstName: "Jane" })
      );
      RecipeServices.getRecipesByUserId.mockResolvedValue({ data: [] });

      wrapper = await mountRecipes();

      expect(wrapper.text()).toContain("Recipes");
      expect(wrapper.findAllComponents({ name: "VCard" }).length).toBe(0);
      expect(pdfIcon(wrapper)).toBeUndefined();
      expect(mockDoc.save).not.toHaveBeenCalled();
    });
  });

  describe("US-6.2 — Open a downloaded recipe PDF", () => {
    it("Opened recipe PDF shows the recipe name, ingredients, and steps", async () => {
      await RecipeReports.generateRecipePDF(pancakes);

      const texts = textCalls();
      expect(texts).toContain("Pancakes");
      expect(texts).toContain("Ingredients");
      expect(
        texts.some(
          (line) =>
            line.includes("2") &&
            line.includes("cup") &&
            line.includes("Flour")
        )
      ).toBe(true);

      expect(mockDoc.autoTable).toHaveBeenCalled();
      const table = mockDoc.autoTable.mock.calls[0][0];
      expect(table.columns).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ title: "Step" }),
          expect.objectContaining({ title: "Instruction" }),
          expect.objectContaining({ title: "Ingredients" }),
        ])
      );
      expect(table.body[0].stepNumber).toBe(1);
      expect(table.body[0].instruction).toBe("Mix the batter");
      expect(table.body[0].ingredientList).toContain("Flour");
    });

    it("Opened recipe PDF has oc_logo.png in the upper left", async () => {
      await RecipeReports.generateRecipePDF(pancakes);

      expect(mockDoc.addImage).toHaveBeenCalled();
      const [image, format, x, y] = mockDoc.addImage.mock.calls[0];
      expect(format).toBe("PNG");
      expect(x).toBeLessThan(1);
      expect(y).toBeLessThan(1);
      expect(String(image.src)).toMatch(/oc_logo\.png/);
    });

    it("Recipe with no ingredients or steps still downloads as a PDF", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({ id: 1, token: "test-token", firstName: "Jane" })
      );
      RecipeServices.getRecipesByUserId.mockResolvedValue({
        data: [pancakes],
      });
      RecipeIngredientServices.getRecipeIngredientsForRecipe.mockResolvedValue({
        data: [],
      });
      RecipeStepServices.getRecipeStepsForRecipeWithIngredients.mockResolvedValue(
        { data: [] }
      );

      wrapper = await mountRecipes();
      const icon = pdfIcon(wrapper);
      expect(icon).toBeTruthy();
      await icon.trigger("click");
      await flushPromises();

      expect(mockDoc.save).toHaveBeenCalled();
      const texts = textCalls();
      expect(
        texts.some(
          (line) =>
            line.includes("2") &&
            line.includes("cup") &&
            line.includes("Flour")
        )
      ).toBe(false);
      const table = mockDoc.autoTable.mock.calls[0]?.[0];
      expect(table?.body ?? []).toEqual([]);
    });
  });
});
