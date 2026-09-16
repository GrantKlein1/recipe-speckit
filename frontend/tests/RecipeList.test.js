/**
 * Feature 4 — Recipe Ingredients and Steps Management
 * Spec: features/feature-4-recipe-ingredients-management.md
 */

import { flushPromises, mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RecipeList from "../src/views/RecipeList.vue";

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

vi.mock("vue-router", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useRoute: () => ({ name: "recipes", params: {} }),
    useRouter: () => ({ push: vi.fn() }),
  };
});

const { RecipeServices, RecipeIngredientServices, RecipeStepServices } =
  vi.hoisted(() => ({
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
  }));

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
vi.mock("../src/reports/RecipeReports.js", () => ({
  default: { generateRecipePDF: vi.fn() },
}));

describe("Feature 4 — Recipe Ingredients and Steps Management", () => {
  let wrapper;

  beforeEach(() => {
    localStorage.setItem(
      "user",
      JSON.stringify({ id: 1, token: "test-token", firstName: "A" })
    );
    RecipeServices.getRecipesByUserId.mockResolvedValue({
      data: [
        {
          id: 1,
          name: "Pancakes",
          servings: 4,
          time: 20,
          description: "Breakfast",
          isPublished: false,
        },
      ],
    });
    RecipeIngredientServices.getRecipeIngredientsForRecipe.mockResolvedValue({
      data: [],
    });
    RecipeStepServices.getRecipeStepsForRecipeWithIngredients.mockResolvedValue(
      { data: [] }
    );
  });

  afterEach(() => {
    wrapper?.unmount();
    document.body.innerHTML = "";
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe("US-4.1 — Add ingredients to a recipe", () => {
    it("Add ingredient is only available on Edit Recipe", async () => {
      const vuetify = createVuetify({ components, directives });
      wrapper = mount(RecipeList, {
        global: { plugins: [vuetify] },
      });
      await flushPromises();

      expect(wrapper.text()).not.toContain("Add Ingredient");
      expect(wrapper.html()).not.toContain("openAddIngredient");
    });
  });
});
