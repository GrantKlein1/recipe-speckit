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
import RecipeList from "../src/views/RecipeList.vue";

const {
  getRecipesMock,
  getRecipesByUserIdMock,
  addRecipeMock,
  getRecipeIngredientsMock,
  getRecipeStepsMock,
} = vi.hoisted(() => ({
  getRecipesMock: vi.fn(),
  getRecipesByUserIdMock: vi.fn(),
  addRecipeMock: vi.fn(),
  getRecipeIngredientsMock: vi.fn(),
  getRecipeStepsMock: vi.fn(),
}));

vi.mock("../src/services/RecipeServices", () => ({
  default: {
    getRecipes: (...args) => getRecipesMock(...args),
    getRecipesByUserId: (...args) => getRecipesByUserIdMock(...args),
    addRecipe: (...args) => addRecipeMock(...args),
    getRecipe: vi.fn(),
    updateRecipe: vi.fn(),
    deleteRecipe: vi.fn(),
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
    getRecipeStepsForRecipeWithIngredients: (...args) =>
      getRecipeStepsMock(...args),
    getRecipeStepsForRecipe: (...args) => getRecipeStepsMock(...args),
  },
}));

vi.mock("../src/reports/RecipeReports", () => ({
  default: {
    generateRecipePDF: vi.fn(),
  },
}));

function makeVuetify() {
  return createVuetify({ components, directives });
}

async function mountRecipeList() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/recipes", name: "recipes", component: RecipeList },
      {
        path: "/recipe/:id",
        name: "editRecipe",
        component: { template: "<div />" },
      },
      { path: "/", name: "login", component: { template: "<div />" } },
    ],
  });
  await router.push("/recipes");
  await router.isReady();

  const wrapper = mount(RecipeList, {
    global: {
      plugins: [makeVuetify(), router],
      stubs: {
        // Render dialog body inline (avoid Teleport / attachTo VTU issues)
        VDialog: {
          name: "VDialog",
          props: ["modelValue"],
          template: `<div v-if="modelValue" class="v-dialog-stub"><slot /></div>`,
        },
      },
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
    getRecipesMock.mockReset();
    getRecipesByUserIdMock.mockReset();
    addRecipeMock.mockReset();
    getRecipeIngredientsMock.mockReset();
    getRecipeStepsMock.mockReset();
    getRecipeIngredientsMock.mockResolvedValue({ data: [] });
    getRecipeStepsMock.mockResolvedValue({ data: [] });
    addRecipeMock.mockResolvedValue({
      data: { id: 99, name: "New", isPublished: true },
    });
  });

  describe("US-5.2 — Choose publish when creating a recipe", () => {
    it("User creates a published recipe", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: 7,
          firstName: "Pat",
          lastName: "Cook",
          email: "pat@example.com",
          token: "tok",
        })
      );
      getRecipesByUserIdMock.mockResolvedValue({ data: [] });

      const wrapper = await mountRecipeList();
      const addBtn = wrapper
        .findAllComponents({ name: "VBtn" })
        .find((b) => b.text().trim() === "Add");
      expect(addBtn).toBeTruthy();
      await addBtn.trigger("click");
      await flushPromises();

      await fieldByLabel(wrapper, "Name").setValue("Published Chili");
      await fieldByLabel(wrapper, "Number of Servings").setValue(6);
      await fieldByLabel(wrapper, "Time to Make (in minutes)").setValue(45);

      const descriptionField = wrapper.findComponent({ name: "VTextarea" });
      await descriptionField.setValue("Spicy chili");

      const publishSwitch = wrapper.findComponent({ name: "VSwitch" });
      await publishSwitch.setValue(true);
      await flushPromises();

      const confirmBtn = wrapper
        .findAllComponents({ name: "VBtn" })
        .find((b) => b.text().includes("Add Recipe"));
      expect(confirmBtn).toBeTruthy();
      await confirmBtn.trigger("click");
      await flushPromises();

      expect(addRecipeMock).toHaveBeenCalled();
      const payload = addRecipeMock.mock.calls[0][0];
      expect(payload.isPublished).toBe(true);
      expect(payload.name).toBe("Published Chili");
      expect(payload.userId).toBe(7);
      wrapper.unmount();
    });

    it("User creates a private recipe by default", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: 8,
          firstName: "Sam",
          lastName: "Cook",
          email: "sam@example.com",
          token: "tok",
        })
      );
      getRecipesByUserIdMock.mockResolvedValue({ data: [] });

      const wrapper = await mountRecipeList();
      const addBtn = wrapper
        .findAllComponents({ name: "VBtn" })
        .find((b) => b.text().trim() === "Add");
      await addBtn.trigger("click");
      await flushPromises();

      await fieldByLabel(wrapper, "Name").setValue("Private Stew");
      const descriptionField = wrapper.findComponent({ name: "VTextarea" });
      await descriptionField.setValue("Not shared yet");

      const publishSwitch = wrapper.findComponent({ name: "VSwitch" });
      expect(publishSwitch.props("modelValue")).toBe(false);

      const confirmBtn = wrapper
        .findAllComponents({ name: "VBtn" })
        .find((b) => b.text().includes("Add Recipe"));
      expect(confirmBtn).toBeTruthy();
      await confirmBtn.trigger("click");
      await flushPromises();

      expect(addRecipeMock).toHaveBeenCalled();
      const payload = addRecipeMock.mock.calls[0][0];
      expect(payload.isPublished).toBe(false);
      expect(payload.name).toBe("Private Stew");
      wrapper.unmount();
    });
  });

  describe("US-5.3 — View published recipes from login", () => {
    it("Visitor opens published recipes from login", async () => {
      getRecipesMock.mockResolvedValue({
        data: [
          {
            id: 1,
            name: "Shared Soup",
            description: "Public soup",
            servings: 4,
            time: 25,
            isPublished: true,
          },
        ],
      });

      const wrapper = await mountRecipeList();
      expect(getRecipesMock).toHaveBeenCalled();
      expect(wrapper.text()).toContain("Shared Soup");
      const addBtn = wrapper
        .findAllComponents({ name: "VBtn" })
        .find((b) => b.text().trim() === "Add");
      expect(addBtn).toBeFalsy();
      wrapper.unmount();
    });

    it("No published recipes", async () => {
      getRecipesMock.mockResolvedValue({ data: [] });

      const wrapper = await mountRecipeList();
      expect(getRecipesMock).toHaveBeenCalled();
      expect(wrapper.text()).toContain("Recipes");
      expect(wrapper.findAllComponents({ name: "VCard" }).length).toBe(0);
      expect(wrapper.text()).not.toContain("No published recipes yet.");
      wrapper.unmount();
    });
  });

  describe("US-5.4 — Browse published recipe details", () => {
    it("Visitor expands a published recipe card", async () => {
      getRecipesMock.mockResolvedValue({
        data: [
          {
            id: 3,
            name: "Pasta Primavera",
            description: "Spring vegetables over pasta",
            servings: 4,
            time: 30,
            isPublished: true,
          },
        ],
      });
      getRecipeIngredientsMock.mockResolvedValue({
        data: [
          {
            id: 1,
            quantity: 2,
            ingredient: { name: "tomato", unit: "cup", pricePerUnit: 1.5 },
          },
        ],
      });
      getRecipeStepsMock.mockResolvedValue({
        data: [
          {
            id: 1,
            stepNumber: 1,
            instruction: "Chop vegetables",
            recipeIngredient: [{ id: 1, ingredient: { name: "tomato" } }],
          },
        ],
      });

      const wrapper = await mountRecipeList();
      expect(wrapper.text()).toContain("Pasta Primavera");
      expect(wrapper.text()).toContain("Spring vegetables over pasta");
      expect(wrapper.text()).toContain("4");
      expect(wrapper.text()).toContain("30");

      const card = wrapper.findComponent({ name: "VCard" });
      await card.trigger("click");
      await flushPromises();

      expect(wrapper.text()).toContain("tomato");
      expect(wrapper.text()).toContain("Chop vegetables");
      expect(wrapper.html()).not.toContain("mdi-pencil");
      expect(wrapper.html()).not.toContain("mdi-file-pdf-box");
      wrapper.unmount();
    });
  });

  describe("US-5.5 — Unpublished recipes stay off the public list", () => {
    it("Guest UI does not show unpublished recipes", async () => {
      getRecipesMock.mockResolvedValue({
        data: [
          {
            id: 2,
            name: "Shared Soup",
            description: "Public",
            servings: 2,
            time: 10,
            isPublished: true,
          },
        ],
      });

      const wrapper = await mountRecipeList();
      expect(wrapper.text()).toContain("Shared Soup");
      expect(wrapper.text()).not.toContain("Secret Cake");
      expect(getRecipesMock).toHaveBeenCalled();
      expect(getRecipesByUserIdMock).not.toHaveBeenCalled();
      wrapper.unmount();
    });
  });
});
