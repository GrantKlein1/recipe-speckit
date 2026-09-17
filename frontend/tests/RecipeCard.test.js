/**
 * Feature 3 — Recipe Management
 * Spec: features/feature-3-recipe-management.md
 */

import { mount, flushPromises } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RecipeCard from "../src/components/RecipeCardComponent.vue";
import RecipeReports from "../src/reports/RecipeReports.js";

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("../src/services/RecipeIngredientServices.js", () => ({
  default: {
    getRecipeIngredientsForRecipe: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock("../src/services/RecipeStepServices.js", () => ({
  default: {
    getRecipeStepsForRecipeWithIngredients: vi
      .fn()
      .mockResolvedValue({ data: [] }),
  },
}));

vi.mock("../src/reports/RecipeReports.js", () => ({
  default: {
    generateRecipePDF: vi.fn(),
  },
}));

const pancake = {
  id: 7,
  name: "Pancakes",
  description: "Weekend breakfast",
  servings: 4,
  time: 20,
  isPublished: true,
  userId: 1,
};

function mountCard() {
  const vuetify = createVuetify({ components, directives });
  return mount(RecipeCard, {
    props: { recipe: pancake },
    global: {
      plugins: [vuetify],
    },
  });
}

function iconByName(wrapper, icon) {
  return wrapper
    .findAllComponents({ name: "VIcon" })
    .find((c) => c.props("icon") === icon);
}

describe("Feature 3 — Recipe Management", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("US-3.3 — Edit a recipe", () => {
    it("Pencil and PDF icons are hidden when signed out", async () => {
      const wrapper = mountCard();
      await flushPromises();

      expect(iconByName(wrapper, "mdi-pencil")).toBeUndefined();
      expect(iconByName(wrapper, "mdi-file-pdf-box")).toBeUndefined();
    });
  });

  describe("US-3.4 — Download a recipe PDF", () => {
    it("Signed-in user downloads a recipe PDF", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: 1,
          token: "test-token",
          email: "jane@example.com",
        })
      );

      const wrapper = mountCard();
      await flushPromises();

      const pdfIcon = iconByName(wrapper, "mdi-file-pdf-box");
      expect(pdfIcon).toBeTruthy();
      await pdfIcon.trigger("click");
      await flushPromises();

      expect(RecipeReports.generateRecipePDF).toHaveBeenCalledWith(pancake);
    });
  });
});
