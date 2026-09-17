/**
 * Feature 3 — Recipe Management
 * Spec: features/feature-3-recipe-management.md
 */

import { mount, flushPromises } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EditRecipe from "../src/views/EditRecipe.vue";
import RecipeServices from "../src/services/RecipeServices.js";
import IngredientServices from "../src/services/IngredientServices.js";
import RecipeIngredientServices from "../src/services/RecipeIngredientServices.js";
import RecipeStepServices from "../src/services/RecipeStepServices.js";

vi.mock("vue-router", () => ({
  useRoute: () => ({ params: { id: "1" } }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("../src/services/RecipeServices.js", () => ({
  default: {
    getRecipe: vi.fn(),
    updateRecipe: vi.fn(),
  },
}));

vi.mock("../src/services/IngredientServices.js", () => ({
  default: {
    getIngredients: vi.fn().mockResolvedValue({ data: [] }),
  },
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

const SnackbarStub = {
  name: "VSnackbar",
  props: {
    modelValue: { type: Boolean, default: false },
  },
  template: `<div v-if="modelValue" class="snackbar-stub"><slot /><slot name="actions" /></div>`,
};

const pancake = {
  id: 1,
  name: "Pancakes",
  description: "Weekend breakfast",
  servings: 4,
  time: 20,
  isPublished: false,
  userId: 1,
};

function mountView() {
  const vuetify = createVuetify({ components, directives });
  return mount(EditRecipe, {
    global: {
      plugins: [vuetify],
      stubs: {
        VDialog: {
          name: "VDialog",
          props: { modelValue: { type: Boolean, default: false } },
          template: `<div v-if="modelValue"><slot /></div>`,
        },
        VSnackbar: SnackbarStub,
      },
    },
  });
}

function findButtonByText(wrapper, text) {
  return wrapper.findAll("button").find((btn) => btn.text().trim() === text);
}

describe("Feature 3 — Recipe Management", () => {
  beforeEach(() => {
    localStorage.setItem(
      "user",
      JSON.stringify({ id: 1, token: "test-token", email: "jane@example.com" })
    );
    vi.clearAllMocks();
    RecipeServices.getRecipe.mockResolvedValue({ data: [pancake] });
    RecipeServices.updateRecipe.mockResolvedValue({
      data: { message: "Recipe was updated successfully." },
    });
    IngredientServices.getIngredients.mockResolvedValue({ data: [] });
    RecipeIngredientServices.getRecipeIngredientsForRecipe.mockResolvedValue({
      data: [],
    });
    RecipeStepServices.getRecipeStepsForRecipeWithIngredients.mockResolvedValue(
      { data: [] }
    );
  });

  describe("US-3.3 — Edit a recipe", () => {
    it("Signed-in user updates a recipe", async () => {
      const wrapper = mountView();
      await flushPromises();

      expect(wrapper.text()).toContain("Edit Recipe");
      expect(RecipeServices.getRecipe).toHaveBeenCalled();

      const servingsField = wrapper
        .findAllComponents({ name: "VTextField" })
        .find((c) => c.props("label") === "Number of Servings");
      await servingsField.vm.$emit("update:modelValue", 6);
      await flushPromises();

      const updateBtn = findButtonByText(wrapper, "Update Recipe");
      expect(updateBtn).toBeTruthy();
      await updateBtn.trigger("click");
      await flushPromises();

      expect(RecipeServices.updateRecipe).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          id: 1,
          name: "Pancakes",
          servings: 6,
        })
      );
      expect(wrapper.text()).toContain("Pancakes updated successfully!");
    });
  });
});
