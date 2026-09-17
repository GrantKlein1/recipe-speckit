/**
 * Feature 3 — Recipe Management
 * Spec: features/feature-3-recipe-management.md
 */

import { mount, flushPromises } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RecipeList from "../src/views/RecipeList.vue";
import RecipeServices from "../src/services/RecipeServices.js";

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("../src/services/RecipeServices.js", () => ({
  default: {
    getRecipes: vi.fn(),
    getRecipesByUserId: vi.fn(),
    addRecipe: vi.fn(),
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

vi.mock("../src/reports/RecipeReports.js", () => ({
  default: {
    generateRecipePDF: vi.fn(),
  },
}));

const DialogStub = {
  name: "VDialog",
  props: {
    modelValue: { type: Boolean, default: false },
  },
  template: `<div v-if="modelValue" class="dialog-stub"><slot /></div>`,
};

const SnackbarStub = {
  name: "VSnackbar",
  props: {
    modelValue: { type: Boolean, default: false },
  },
  template: `<div v-if="modelValue" class="snackbar-stub"><slot /><slot name="actions" /></div>`,
};

const sessionUser = {
  id: 1,
  token: "test-token",
  email: "jane@example.com",
  firstName: "Jane",
  lastName: "Doe",
};

function mountView() {
  const vuetify = createVuetify({ components, directives });
  return mount(RecipeList, {
    global: {
      plugins: [vuetify],
      stubs: {
        VDialog: DialogStub,
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
    localStorage.clear();
    vi.clearAllMocks();
    RecipeServices.getRecipes.mockResolvedValue({ data: [] });
    RecipeServices.getRecipesByUserId.mockResolvedValue({ data: [] });
    RecipeServices.addRecipe.mockResolvedValue({
      data: { id: 1, name: "Pancakes" },
    });
  });

  describe("US-3.1 — Create a recipe", () => {
    it("Signed-in user adds a recipe", async () => {
      localStorage.setItem("user", JSON.stringify(sessionUser));
      RecipeServices.getRecipesByUserId
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({
          data: [
            {
              id: 1,
              name: "Pancakes",
              description: "Weekend breakfast",
              servings: 4,
              time: 20,
              isPublished: false,
              userId: 1,
            },
          ],
        });

      const wrapper = mountView();
      await flushPromises();

      const addBtn = findButtonByText(wrapper, "Add");
      expect(addBtn).toBeTruthy();
      await addBtn.trigger("click");
      await flushPromises();

      expect(wrapper.text()).toContain("Add Recipe");

      const nameField = wrapper
        .findAllComponents({ name: "VTextField" })
        .find((c) => c.props("label") === "Name");
      const servingsField = wrapper
        .findAllComponents({ name: "VTextField" })
        .find((c) => c.props("label") === "Number of Servings");
      const timeField = wrapper
        .findAllComponents({ name: "VTextField" })
        .find((c) => c.props("label") === "Time to Make (in minutes)");
      const descriptionField = wrapper.findComponent({ name: "VTextarea" });

      await nameField.vm.$emit("update:modelValue", "Pancakes");
      await servingsField.vm.$emit("update:modelValue", 4);
      await timeField.vm.$emit("update:modelValue", 20);
      await descriptionField.vm.$emit("update:modelValue", "Weekend breakfast");
      await flushPromises();

      const confirmBtn = findButtonByText(wrapper, "Add Recipe");
      expect(confirmBtn).toBeTruthy();
      await confirmBtn.trigger("click");
      await flushPromises();

      expect(RecipeServices.addRecipe).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Pancakes",
          servings: 4,
          time: 20,
          description: "Weekend breakfast",
          userId: 1,
        })
      );
      expect(wrapper.text()).toContain("Pancakes");
      expect(wrapper.text()).toContain("Pancakes added successfully!");
    });

    it("Add button is hidden when signed out", async () => {
      RecipeServices.getRecipes.mockResolvedValue({ data: [] });

      const wrapper = mountView();
      await flushPromises();

      const addBtn = findButtonByText(wrapper, "Add");
      expect(addBtn).toBeUndefined();
    });
  });

  describe("US-3.2 — View my recipes", () => {
    it("Signed-in user views their recipes", async () => {
      localStorage.setItem("user", JSON.stringify(sessionUser));
      RecipeServices.getRecipesByUserId.mockResolvedValue({
        data: [
          {
            id: 1,
            name: "Pancakes",
            description: "Fluffy breakfast",
            servings: 4,
            time: 20,
            userId: 1,
          },
          {
            id: 2,
            name: "Chili",
            description: "Weeknight dinner",
            servings: 6,
            time: 45,
            userId: 1,
          },
        ],
      });

      const wrapper = mountView();
      await flushPromises();

      expect(RecipeServices.getRecipesByUserId).toHaveBeenCalledWith(1);
      expect(wrapper.text()).toContain("Pancakes");
      expect(wrapper.text()).toContain("Chili");
      expect(wrapper.text()).toContain("4 Servings");
      expect(wrapper.text()).toContain("6 Servings");
      expect(wrapper.text()).toContain("20 minutes");
      expect(wrapper.text()).toContain("45 minutes");
      expect(wrapper.text()).toContain("Fluffy breakfast");
      expect(wrapper.text()).toContain("Weeknight dinner");
    });
  });
});
