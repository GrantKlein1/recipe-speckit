/**
 * Feature 5 — Published Recipe Management
 * Spec: features/feature-5-published-recipe-management.md
 */

import { flushPromises, mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { createRouter, createMemoryHistory } from "vue-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EditRecipe from "../src/views/EditRecipe.vue";

const {
  getRecipeMock,
  updateRecipeMock,
  getIngredientsMock,
  getRecipeIngredientsMock,
  getRecipeStepsMock,
} = vi.hoisted(() => ({
  getRecipeMock: vi.fn(),
  updateRecipeMock: vi.fn(),
  getIngredientsMock: vi.fn(),
  getRecipeIngredientsMock: vi.fn(),
  getRecipeStepsMock: vi.fn(),
}));

vi.mock("../src/services/RecipeServices", () => ({
  default: {
    getRecipe: (...args) => getRecipeMock(...args),
    updateRecipe: (...args) => updateRecipeMock(...args),
    getRecipes: vi.fn(),
    getRecipesByUserId: vi.fn(),
    addRecipe: vi.fn(),
    deleteRecipe: vi.fn(),
  },
  IngredientServices: {
    getIngredients: vi.fn(),
  },
  RecipeIngredientServices: {
    getRecipeIngredientsForRecipe: vi.fn(),
    addRecipeIngredient: vi.fn(),
    updateRecipeIngredient: vi.fn(),
    deleteRecipeIngredient: vi.fn(),
  },
  RecipeStepServices: {
    getRecipeStepsForRecipeWithIngredients: vi.fn(),
    addRecipeStep: vi.fn(),
    updateRecipeStep: vi.fn(),
    deleteRecipeStep: vi.fn(),
  },
}));

vi.mock("../src/services/IngredientServices", () => ({
  default: {
    getIngredients: (...args) => getIngredientsMock(...args),
  },
}));

vi.mock("../src/services/RecipeIngredientServices", () => ({
  default: {
    getRecipeIngredientsForRecipe: (...args) =>
      getRecipeIngredientsMock(...args),
  },
}));

vi.mock("../src/services/RecipeStepServices", () => ({
  default: {
    getRecipeStepsForRecipe: (...args) => getRecipeStepsMock(...args),
    getRecipeStepsForRecipeWithIngredients: (...args) =>
      getRecipeStepsMock(...args),
  },
}));

function makeVuetify() {
  return createVuetify({ components, directives });
}

async function mountEditRecipe(recipeId = "1") {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: "/recipe/:id",
        name: "editRecipe",
        component: EditRecipe,
        props: true,
      },
    ],
  });
  await router.push(`/recipe/${recipeId}`);
  await router.isReady();

  const wrapper = mount(EditRecipe, {
    global: {
      plugins: [makeVuetify(), router],
    },
  });
  await flushPromises();
  return wrapper;
}

function fieldByLabel(wrapper, label) {
  return wrapper
    .findAllComponents({ name: "VTextField" })
    .find((c) => c.props("label") === label);
}

describe("Feature 5 — Published Recipe Management", () => {
  beforeEach(() => {
    localStorage.clear();
    getRecipeMock.mockReset();
    updateRecipeMock.mockReset();
    getIngredientsMock.mockReset();
    getRecipeIngredientsMock.mockReset();
    getRecipeStepsMock.mockReset();
    getIngredientsMock.mockResolvedValue({ data: [] });
    getRecipeIngredientsMock.mockResolvedValue({ data: [] });
    getRecipeStepsMock.mockResolvedValue({ data: [] });
    updateRecipeMock.mockResolvedValue({
      data: { message: "Recipe was updated successfully." },
    });
  });

  describe("US-5.1 — Publish or unpublish from edit recipe", () => {
    it("Owner publishes a recipe", async () => {
      getRecipeMock.mockResolvedValue({
        data: [
          {
            id: 1,
            name: "Pasta Primavera",
            description: "Spring vegetables over pasta",
            servings: 4,
            time: 30,
            isPublished: false,
            userId: 10,
          },
        ],
      });

      const wrapper = await mountEditRecipe("1");
      expect(getRecipeMock).toHaveBeenCalled();
      expect(fieldByLabel(wrapper, "Name").props("modelValue")).toBe(
        "Pasta Primavera"
      );

      const publishSwitch = wrapper.findComponent({ name: "VSwitch" });
      expect(publishSwitch.exists()).toBe(true);
      expect(publishSwitch.props("modelValue")).toBe(false);
      await publishSwitch.setValue(true);
      await flushPromises();
      expect(wrapper.text()).toContain("Whisk the eggs");
      expect(wrapper.text()).not.toContain("Mix the batter");

      const updateBtn = wrapper
        .findAllComponents({ name: "VBtn" })
        .find((b) => b.text().includes("Update Recipe"));
      expect(updateBtn).toBeTruthy();
      await updateBtn.trigger("click");
      await flushPromises();
      expect(wrapper.text()).toContain("Mix the batter");
      expect(wrapper.text()).not.toContain("Whisk the eggs");
    });

    it("Recipe steps are listed by step number ascending", async () => {
      RecipeStepServices.getRecipeStepsForRecipeWithIngredients.mockResolvedValue(
        {
          data: [
            mixStep({ id: 20, stepNumber: 1, instruction: "Mix the batter" }),
            mixStep({ id: 21, stepNumber: 2, instruction: "Heat the pan" }),
            mixStep({ id: 22, stepNumber: 3, instruction: "Plate it" }),
          ],
        }
      );

      wrapper = mountView();
      await flushPromises();

      const rows = wrapper.findAll("tbody tr").map((row) => row.text());
      expect(rows[0]).toContain("1");
      expect(rows[0]).toContain("Mix the batter");
      expect(rows[1]).toContain("2");
      expect(rows[1]).toContain("Heat the pan");
      expect(rows[2]).toContain("3");
      expect(rows[2]).toContain("Plate it");
    });

      expect(updateRecipeMock).toHaveBeenCalled();
      const [, payload] = updateRecipeMock.mock.calls[0];
      expect(payload.isPublished).toBe(true);
      expect(payload.name).toBe("Pasta Primavera");
    });

    it("Owner unpublishes a recipe", async () => {
      getRecipeMock.mockResolvedValue({
        data: [
          {
            id: 1,
            name: "Pasta Primavera",
            description: "Spring vegetables over pasta",
            servings: 4,
            time: 30,
            isPublished: true,
            userId: 10,
          },
        ],
      });

      const wrapper = await mountEditRecipe("1");
      expect(fieldByLabel(wrapper, "Name").props("modelValue")).toBe(
        "Pasta Primavera"
      );

      const publishSwitch = wrapper.findComponent({ name: "VSwitch" });
      expect(publishSwitch.props("modelValue")).toBe(true);
      await publishSwitch.setValue(false);
      await flushPromises();

      const updateBtn = wrapper
        .findAllComponents({ name: "VBtn" })
        .find((b) => b.text().includes("Update Recipe"));
      await updateBtn.trigger("click");
      await flushPromises();

      expect(updateRecipeMock).toHaveBeenCalled();
      const [, payload] = updateRecipeMock.mock.calls[0];
      expect(payload.isPublished).toBe(false);
    });
  });
});
