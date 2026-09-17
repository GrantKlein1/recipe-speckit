/**
 * Feature 4 — Recipe Ingredients and Steps Management
 * Spec: features/feature-4-recipe-ingredients-management.md
 */

import { flushPromises, mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import EditRecipe from "../src/views/EditRecipe.vue";

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

const routeParams = { id: "1" };

vi.mock("vue-router", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useRoute: () => ({ params: routeParams }),
    useRouter: () => ({ push: vi.fn() }),
  };
});

const {
  RecipeServices,
  IngredientServices,
  RecipeIngredientServices,
  RecipeStepServices,
} = vi.hoisted(() => ({
  RecipeServices: {
    getRecipe: vi.fn(),
    updateRecipe: vi.fn(),
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

vi.mock("../src/services/RecipeServices.js", () => ({
  default: RecipeServices,
}));
vi.mock("../src/services/IngredientServices.js", () => ({
  default: IngredientServices,
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
const omelette = {
  id: 2,
  name: "Omelette",
  servings: 2,
  time: 10,
  description: "Eggs",
  isPublished: false,
};
const flour = { id: 1, name: "Flour", unit: "cup", pricePerUnit: "1.50" };
const eggs = { id: 2, name: "Eggs", unit: "each", pricePerUnit: "0.30" };
const milk = { id: 3, name: "Milk", unit: "cup", pricePerUnit: "0.50" };

function flourLine(overrides = {}) {
  return {
    id: 10,
    quantity: 2,
    recipeId: 1,
    ingredientId: flour.id,
    recipeStepId: null,
    ingredient: flour,
    ...overrides,
  };
}

function milkLine(overrides = {}) {
  return {
    id: 11,
    quantity: 1,
    recipeId: 1,
    ingredientId: milk.id,
    recipeStepId: null,
    ingredient: milk,
    ...overrides,
  };
}

function mixStep(overrides = {}) {
  return {
    id: 20,
    stepNumber: 1,
    instruction: "Mix the batter",
    recipeId: 1,
    recipeIngredient: [],
    ...overrides,
  };
}

const dialogStub = {
  name: "VDialog",
  props: {
    modelValue: { type: Boolean, default: false },
  },
  template: '<div v-if="modelValue" class="dialog-stub"><slot /></div>',
};

const snackbarStub = {
  name: "VSnackbar",
  template: '<div class="snackbar-stub"><slot /></div>',
};

function mountView() {
  const vuetify = createVuetify({ components, directives });
  return mount(EditRecipe, {
    global: {
      plugins: [vuetify],
      stubs: { VDialog: dialogStub, VSnackbar: snackbarStub },
    },
  });
}

function buttonsByText(wrapper, text) {
  return wrapper
    .findAll("button")
    .filter((button) => button.text().trim() === text);
}

function fieldByLabel(wrapper, name, label) {
  return wrapper
    .findAllComponents({ name })
    .find((field) => field.props("label") === label);
}

function iconsByName(wrapper, icon) {
  return wrapper
    .findAllComponents({ name: "VIcon" })
    .filter((item) => item.props("icon") === icon);
}

async function openIngredientsAdd(wrapper) {
  await buttonsByText(wrapper, "Add")[0].trigger("click");
  await flushPromises();
}

async function openStepsAdd(wrapper) {
  await buttonsByText(wrapper, "Add")[1].trigger("click");
  await flushPromises();
}

describe("Feature 4 — Recipe Ingredients and Steps Management", () => {
  let wrapper;

  beforeEach(() => {
    routeParams.id = "1";
    localStorage.setItem(
      "user",
      JSON.stringify({ id: 1, token: "test-token", firstName: "A" })
    );
    RecipeServices.getRecipe.mockResolvedValue({ data: [pancakes] });
    IngredientServices.getIngredients.mockResolvedValue({
      data: [flour, eggs, milk],
    });
    RecipeIngredientServices.getRecipeIngredientsForRecipe.mockResolvedValue({
      data: [],
    });
    RecipeIngredientServices.addRecipeIngredient.mockResolvedValue({
      status: 200,
      data: flourLine(),
    });
    RecipeIngredientServices.updateRecipeIngredient.mockResolvedValue({
      status: 200,
      data: { message: "RecipeIngredient was updated successfully." },
    });
    RecipeIngredientServices.deleteRecipeIngredient.mockResolvedValue({
      status: 200,
      data: { message: "RecipeIngredient was deleted successfully!" },
    });
    RecipeStepServices.getRecipeStepsForRecipeWithIngredients.mockResolvedValue(
      { data: [] }
    );
    RecipeStepServices.addRecipeStep.mockResolvedValue({
      status: 200,
      data: mixStep(),
    });
    RecipeStepServices.updateRecipeStep.mockResolvedValue({
      status: 200,
      data: { message: "RecipeStep was updated successfully." },
    });
    RecipeStepServices.deleteRecipeStep.mockResolvedValue({
      status: 200,
      data: { message: "RecipeStep was deleted successfully!" },
    });
  });

  afterEach(() => {
    try {
      wrapper?.unmount();
    } catch {
      /* Vue 3.2 + Vuetify overlay teardown */
    }
    wrapper = null;
    document.body.innerHTML = "";
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe("US-4.1 — Add ingredients to a recipe", () => {
    it("User adds an ingredient to a recipe via dialog", async () => {
      RecipeIngredientServices.getRecipeIngredientsForRecipe
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [flourLine()] });

      wrapper = mountView();
      await flushPromises();
      await openIngredientsAdd(wrapper);

      await fieldByLabel(wrapper, "VTextField", "Quantity").vm.$emit(
        "update:modelValue",
        2
      );
      await fieldByLabel(wrapper, "VSelect", "Ingredients").vm.$emit(
        "update:modelValue",
        flour
      );
      await buttonsByText(wrapper, "Add Ingredient")[0].trigger("click");
      await flushPromises();

      expect(RecipeIngredientServices.addRecipeIngredient).toHaveBeenCalled();
      const payload =
        RecipeIngredientServices.addRecipeIngredient.mock.calls[0][0];
      expect(Number(payload.quantity)).toBe(2);
      expect(payload.ingredientId).toBe(flour.id);
      expect(payload.recipeId).toBe(pancakes.id);
      expect(payload.recipeStepId == null).toBe(true);
      expect(wrapper.text()).toContain("2 cups of Flour");
    });

    it("User closes add an ingredient to a recipe", async () => {
      wrapper = mountView();
      await flushPromises();
      await openIngredientsAdd(wrapper);

      await fieldByLabel(wrapper, "VTextField", "Quantity").vm.$emit(
        "update:modelValue",
        2
      );
      await fieldByLabel(wrapper, "VSelect", "Ingredients").vm.$emit(
        "update:modelValue",
        flour
      );
      await buttonsByText(wrapper, "Close")[0].trigger("click");
      await flushPromises();

      expect(
        RecipeIngredientServices.addRecipeIngredient
      ).not.toHaveBeenCalled();
      expect(wrapper.text()).not.toContain("2 cups of Flour");
    });

    it("User adds a recipe ingredient with an empty quantity", async () => {
      wrapper = mountView();
      await flushPromises();
      await openIngredientsAdd(wrapper);

      await fieldByLabel(wrapper, "VSelect", "Ingredients").vm.$emit(
        "update:modelValue",
        flour
      );
      await buttonsByText(wrapper, "Add Ingredient")[0].trigger("click");
      await flushPromises();

      expect(RecipeIngredientServices.addRecipeIngredient).toHaveBeenCalled();
      const payload =
        RecipeIngredientServices.addRecipeIngredient.mock.calls[0][0];
      expect(payload.quantity === undefined || payload.quantity === "").toBe(
        true
      );
      expect(wrapper.text()).not.toContain("of Flour");
    });

    it("User adds a recipe ingredient without selecting a catalog ingredient", async () => {
      wrapper = mountView();
      await flushPromises();
      await openIngredientsAdd(wrapper);

      await fieldByLabel(wrapper, "VTextField", "Quantity").vm.$emit(
        "update:modelValue",
        2
      );
      await expect(wrapper.vm.addIngredient()).rejects.toThrow();
      await flushPromises();

      expect(
        RecipeIngredientServices.addRecipeIngredient
      ).not.toHaveBeenCalled();
    });
  });

  describe("US-4.2 — Add steps to a recipe", () => {
    it("User adds a step to a recipe via dialog", async () => {
      RecipeStepServices.getRecipeStepsForRecipeWithIngredients
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [mixStep()] });

      wrapper = mountView();
      await flushPromises();
      await openStepsAdd(wrapper);

      await fieldByLabel(wrapper, "VTextField", "Number").vm.$emit(
        "update:modelValue",
        1
      );
      await fieldByLabel(wrapper, "VTextarea", "Instruction").vm.$emit(
        "update:modelValue",
        "Mix the batter"
      );
      await buttonsByText(wrapper, "Add Step")[0].trigger("click");
      await flushPromises();

      expect(RecipeStepServices.addRecipeStep).toHaveBeenCalled();
      const payload = RecipeStepServices.addRecipeStep.mock.calls[0][0];
      expect(Number(payload.stepNumber)).toBe(1);
      expect(payload.instruction).toBe("Mix the batter");
      expect(payload.recipeId).toBe(pancakes.id);
      expect(wrapper.text()).toContain("Mix the batter");
    });

    it("User closes add a step to a recipe via dialog", async () => {
      wrapper = mountView();
      await flushPromises();
      await openStepsAdd(wrapper);

      await fieldByLabel(wrapper, "VTextField", "Number").vm.$emit(
        "update:modelValue",
        1
      );
      await fieldByLabel(wrapper, "VTextarea", "Instruction").vm.$emit(
        "update:modelValue",
        "Mix the batter"
      );
      await buttonsByText(wrapper, "Close")[0].trigger("click");
      await flushPromises();

      expect(RecipeStepServices.addRecipeStep).not.toHaveBeenCalled();
      expect(wrapper.text()).not.toContain("Mix the batter");
    });

    it("User adds a step linked to existing recipe ingredients", async () => {
      const line = flourLine();
      RecipeIngredientServices.getRecipeIngredientsForRecipe.mockResolvedValue({
        data: [line],
      });
      RecipeStepServices.getRecipeStepsForRecipeWithIngredients
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({
          data: [
            mixStep({
              recipeIngredient: [flourLine({ recipeStepId: 20 })],
            }),
          ],
        });
      RecipeStepServices.addRecipeStep.mockResolvedValue({
        status: 200,
        data: mixStep(),
      });

      wrapper = mountView();
      await flushPromises();
      await openStepsAdd(wrapper);

      await fieldByLabel(wrapper, "VTextField", "Number").vm.$emit(
        "update:modelValue",
        1
      );
      await fieldByLabel(wrapper, "VTextarea", "Instruction").vm.$emit(
        "update:modelValue",
        "Mix the batter"
      );
      const stepSelect = wrapper
        .findAllComponents({ name: "VSelect" })
        .find((field) => field.props("multiple") === true);
      await stepSelect.vm.$emit("update:modelValue", [line]);
      await buttonsByText(wrapper, "Add Step")[0].trigger("click");
      await flushPromises();

      expect(RecipeStepServices.addRecipeStep).toHaveBeenCalled();
      expect(
        RecipeIngredientServices.updateRecipeIngredient
      ).toHaveBeenCalled();
      const updatePayload =
        RecipeIngredientServices.updateRecipeIngredient.mock.calls[0][0];
      expect(updatePayload.recipeStepId).toBe(20);
      expect(wrapper.text()).toContain("Flour");
    });

    it("User adds a recipe step with an empty instruction", async () => {
      wrapper = mountView();
      await flushPromises();
      await openStepsAdd(wrapper);

      await fieldByLabel(wrapper, "VTextField", "Number").vm.$emit(
        "update:modelValue",
        1
      );
      await buttonsByText(wrapper, "Add Step")[0].trigger("click");
      await flushPromises();

      expect(RecipeStepServices.addRecipeStep).toHaveBeenCalled();
      const payload = RecipeStepServices.addRecipeStep.mock.calls[0][0];
      expect(
        payload.instruction === undefined || payload.instruction === ""
      ).toBe(true);
      expect(wrapper.text()).not.toContain("Mix the batter");
    });
  });

  describe("US-4.3 — View ingredients in a recipe", () => {
    it("Ingredients section shows an empty recipe", async () => {
      wrapper = mountView();
      await flushPromises();

      expect(wrapper.text()).toContain("Ingredients");
      expect(wrapper.text()).not.toContain("of Flour");
      expect(wrapper.text()).not.toContain("of Eggs");
    });

    it("User opens ingredients for different recipes", async () => {
      RecipeServices.getRecipe.mockImplementation((id) => {
        const recipe = String(id) === "2" ? omelette : pancakes;
        return Promise.resolve({ data: [recipe] });
      });
      RecipeIngredientServices.getRecipeIngredientsForRecipe.mockImplementation(
        (id) => {
          if (String(id) === "2") {
            return Promise.resolve({
              data: [
                flourLine({
                  id: 12,
                  recipeId: 2,
                  ingredientId: eggs.id,
                  ingredient: eggs,
                  quantity: 2,
                }),
              ],
            });
          }
          return Promise.resolve({ data: [flourLine()] });
        }
      );

      routeParams.id = "2";
      wrapper = mountView();
      await flushPromises();
      expect(wrapper.text()).toContain("Eggs");
      expect(wrapper.text()).not.toContain("Flour");

      wrapper.unmount();
      routeParams.id = "1";
      wrapper = mountView();
      await flushPromises();
      expect(wrapper.text()).toContain("Flour");
      expect(wrapper.text()).not.toContain("Eggs");
    });

    it("Ingredient listing includes catalog name, unit, and price", async () => {
      RecipeIngredientServices.getRecipeIngredientsForRecipe.mockResolvedValue({
        data: [flourLine()],
      });

      wrapper = mountView();
      await flushPromises();

      expect(wrapper.text()).toContain("2");
      expect(wrapper.text()).toContain("cup");
      expect(wrapper.text()).toContain("Flour");
      expect(wrapper.text()).toContain("1.50");
    });

    it("User only sees their own recipe ingredients", async () => {
      RecipeIngredientServices.getRecipeIngredientsForRecipe.mockResolvedValue({
        data: [flourLine()],
      });

      wrapper = mountView();
      await flushPromises();

      expect(wrapper.text()).toContain("Flour");
      expect(wrapper.text()).not.toContain("Sugar");
    });
  });

  describe("US-4.4 — View steps in a recipe", () => {
    it("Steps section shows an empty recipe", async () => {
      wrapper = mountView();
      await flushPromises();

      expect(wrapper.text()).toContain("Steps");
      expect(wrapper.text()).not.toContain("Mix the batter");
      expect(wrapper.text()).not.toContain("Whisk the eggs");
    });

    it("User opens steps for different recipes", async () => {
      RecipeServices.getRecipe.mockImplementation((id) => {
        const recipe = String(id) === "2" ? omelette : pancakes;
        return Promise.resolve({ data: [recipe] });
      });
      RecipeStepServices.getRecipeStepsForRecipeWithIngredients.mockImplementation(
        (id) => {
          if (String(id) === "2") {
            return Promise.resolve({
              data: [
                mixStep({
                  id: 21,
                  recipeId: 2,
                  instruction: "Whisk the eggs",
                }),
              ],
            });
          }
          return Promise.resolve({ data: [mixStep()] });
        }
      );

      routeParams.id = "2";
      wrapper = mountView();
      await flushPromises();
      expect(wrapper.text()).toContain("Whisk the eggs");
      expect(wrapper.text()).not.toContain("Mix the batter");

      wrapper.unmount();
      routeParams.id = "1";
      wrapper = mountView();
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

    it("Step listing includes linked recipe ingredients", async () => {
      RecipeStepServices.getRecipeStepsForRecipeWithIngredients.mockResolvedValue(
        {
          data: [
            mixStep({
              recipeIngredient: [flourLine({ recipeStepId: 20 })],
            }),
          ],
        }
      );

      wrapper = mountView();
      await flushPromises();

      expect(wrapper.text()).toContain("Mix the batter");
      expect(wrapper.text()).toContain("Flour");
    });
  });

  describe("US-4.5 — Edit and remove ingredients", () => {
    it("User edits a recipe ingredient quantity", async () => {
      RecipeIngredientServices.getRecipeIngredientsForRecipe
        .mockResolvedValueOnce({ data: [flourLine()] })
        .mockResolvedValueOnce({ data: [flourLine({ quantity: 3 })] });

      wrapper = mountView();
      await flushPromises();
      await iconsByName(wrapper, "mdi-pencil")[0].trigger("click");
      await flushPromises();

      await fieldByLabel(wrapper, "VTextField", "Quantity").vm.$emit(
        "update:modelValue",
        3
      );
      await buttonsByText(wrapper, "Update Ingredient")[0].trigger("click");
      await flushPromises();

      expect(
        RecipeIngredientServices.updateRecipeIngredient
      ).toHaveBeenCalled();
      expect(wrapper.text()).toContain("3 cups of Flour");
    });

    it("User changes a recipe ingredient's catalog ingredient", async () => {
      RecipeIngredientServices.getRecipeIngredientsForRecipe
        .mockResolvedValueOnce({ data: [flourLine()] })
        .mockResolvedValueOnce({
          data: [
            flourLine({
              ingredientId: milk.id,
              ingredient: milk,
            }),
          ],
        });

      wrapper = mountView();
      await flushPromises();
      await iconsByName(wrapper, "mdi-pencil")[0].trigger("click");
      await flushPromises();

      await fieldByLabel(wrapper, "VSelect", "Ingredients").vm.$emit(
        "update:modelValue",
        milk
      );
      await buttonsByText(wrapper, "Update Ingredient")[0].trigger("click");
      await flushPromises();

      expect(
        RecipeIngredientServices.updateRecipeIngredient
      ).toHaveBeenCalled();
      const payload =
        RecipeIngredientServices.updateRecipeIngredient.mock.calls[0][0];
      expect(payload.ingredientId).toBe(milk.id);
      expect(wrapper.text()).toContain("Milk");
      expect(wrapper.text()).not.toContain("Flour");
    });

    it("User deletes a recipe ingredient", async () => {
      RecipeIngredientServices.getRecipeIngredientsForRecipe
        .mockResolvedValueOnce({ data: [flourLine()] })
        .mockResolvedValueOnce({ data: [] });
      IngredientServices.getIngredients.mockResolvedValue({ data: [flour] });

      wrapper = mountView();
      await flushPromises();
      await iconsByName(wrapper, "mdi-trash-can")[0].trigger("click");
      await flushPromises();

      expect(
        RecipeIngredientServices.deleteRecipeIngredient
      ).toHaveBeenCalled();
      expect(wrapper.text()).not.toContain("of Flour");
      expect(IngredientServices.getIngredients).toHaveBeenCalled();
    });
  });

  describe("US-4.6 — Edit and remove steps", () => {
    it("User edits a recipe step", async () => {
      RecipeStepServices.getRecipeStepsForRecipeWithIngredients
        .mockResolvedValueOnce({ data: [mixStep()] })
        .mockResolvedValueOnce({
          data: [mixStep({ instruction: "Whisk the batter" })],
        });

      wrapper = mountView();
      await flushPromises();
      await iconsByName(wrapper, "mdi-pencil")[0].trigger("click");
      await flushPromises();

      await fieldByLabel(wrapper, "VTextarea", "Instruction").vm.$emit(
        "update:modelValue",
        "Whisk the batter"
      );
      await buttonsByText(wrapper, "Update Step")[0].trigger("click");
      await flushPromises();

      expect(RecipeStepServices.updateRecipeStep).toHaveBeenCalled();
      expect(wrapper.text()).toContain("Whisk the batter");
    });

    it("User updates which ingredients are linked to a step", async () => {
      const flourLinked = flourLine({ recipeStepId: 20 });
      const milkUnlinked = milkLine();
      RecipeIngredientServices.getRecipeIngredientsForRecipe.mockResolvedValue({
        data: [flourLinked, milkUnlinked],
      });
      RecipeStepServices.getRecipeStepsForRecipeWithIngredients
        .mockResolvedValueOnce({
          data: [
            mixStep({
              recipeIngredient: [flourLinked],
            }),
          ],
        })
        .mockResolvedValueOnce({
          data: [
            mixStep({
              recipeIngredient: [milkLine({ recipeStepId: 20 })],
            }),
          ],
        });

      wrapper = mountView();
      await flushPromises();
      const stepPencil = wrapper.find("tbody").findAllComponents({ name: "VIcon" })[0];
      await stepPencil.trigger("click");
      await flushPromises();

      const stepSelect = wrapper
        .findAllComponents({ name: "VSelect" })
        .find((field) => field.props("multiple") === true);
      expect(stepSelect).toBeTruthy();
      await stepSelect.vm.$emit("update:modelValue", [milkUnlinked]);
      await buttonsByText(wrapper, "Update Step")[0].trigger("click");
      await flushPromises();

      const updates =
        RecipeIngredientServices.updateRecipeIngredient.mock.calls.map(
          (call) => call[0]
        );
      expect(updates.some((row) => row.id === milkUnlinked.id)).toBe(true);
      expect(wrapper.text()).toContain("Milk");
    });

    it("User deletes a recipe step", async () => {
      let steps = [mixStep()];
      RecipeStepServices.getRecipeStepsForRecipeWithIngredients.mockImplementation(
        () => Promise.resolve({ data: steps })
      );
      RecipeStepServices.deleteRecipeStep.mockImplementation(async () => {
        steps = [];
        return { status: 200 };
      });

      wrapper = mountView();
      await flushPromises();
      await wrapper.find("tbody").findAllComponents({ name: "VIcon" })[1].trigger("click");
      await flushPromises();

      expect(RecipeStepServices.deleteRecipeStep).toHaveBeenCalled();
      expect(wrapper.find("tbody").text()).not.toContain("Mix the batter");
    });
  });
});
