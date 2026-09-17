/**
 * Feature 2 — Ingredients Management
 * Spec: features/feature-2-ingredients-management.md
 */

import { mount, flushPromises } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { beforeEach, describe, expect, it, vi } from "vitest";
import IngredientList from "../src/views/IngredientList.vue";
import IngredientServices from "../src/services/IngredientServices.js";

vi.mock("../src/services/IngredientServices.js", () => ({
  default: {
    getIngredients: vi.fn(),
    addIngredient: vi.fn(),
    updateIngredient: vi.fn(),
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

function mountView() {
  const vuetify = createVuetify({ components, directives });
  return mount(IngredientList, {
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
  return wrapper.findAll("button").find((btn) => btn.text().includes(text));
}

describe("Feature 2 — Ingredients Management", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("US-2.1 — View ingredients", () => {
    it("User views the ingredients list", async () => {
      IngredientServices.getIngredients.mockResolvedValue({
        data: [
          { id: 1, name: "Flour", unit: "cup", pricePerUnit: "0.45" },
          { id: 2, name: "Sugar", unit: "cup", pricePerUnit: "0.30" },
        ],
      });

      const wrapper = mountView();
      await flushPromises();

      expect(wrapper.text()).toContain("Flour");
      expect(wrapper.text()).toContain("Sugar");
      expect(wrapper.text()).toContain("cup");
      expect(wrapper.text()).toContain("$0.45");
      expect(wrapper.text()).toContain("$0.30");
    });
  });

  describe("US-2.2 — Add an ingredient", () => {
    it("Signed-in user adds an ingredient", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({ id: 1, token: "test-token", email: "a@example.com" })
      );
      IngredientServices.getIngredients
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({
          data: [
            {
              id: 3,
              name: "Olive Oil",
              unit: "tablespoon",
              pricePerUnit: "0.10",
            },
          ],
        });
      IngredientServices.addIngredient.mockResolvedValue({
        data: {
          id: 3,
          name: "Olive Oil",
          unit: "tablespoon",
          pricePerUnit: "0.10",
        },
      });

      const wrapper = mountView();
      await flushPromises();

      const addBtn = findButtonByText(wrapper, "Add");
      expect(addBtn).toBeTruthy();
      await addBtn.trigger("click");
      await flushPromises();

      expect(wrapper.text()).toContain("Add Ingredient");

      const nameField = wrapper
        .findAllComponents({ name: "VTextField" })
        .find((c) => c.props("label") === "Name");
      const unitField = wrapper.findComponent({ name: "VSelect" });
      const priceField = wrapper
        .findAllComponents({ name: "VTextField" })
        .find((c) => c.props("label") === "Price Per Unit");

      await nameField.vm.$emit("update:modelValue", "Olive Oil");
      await unitField.vm.$emit("update:modelValue", "tablespoon");
      await priceField.vm.$emit("update:modelValue", 0.1);
      await flushPromises();

      const confirmBtn = findButtonByText(wrapper, "Add Ingredient");
      expect(confirmBtn).toBeTruthy();
      await confirmBtn.trigger("click");
      await flushPromises();

      expect(IngredientServices.addIngredient).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Olive Oil",
          unit: "tablespoon",
          pricePerUnit: 0.1,
        })
      );
      expect(wrapper.text()).toContain("Olive Oil");
      expect(wrapper.text()).toContain("added successfully");
    });

    it("Add button is hidden when signed out", async () => {
      IngredientServices.getIngredients.mockResolvedValue({ data: [] });

      const wrapper = mountView();
      await flushPromises();

      const addBtn = wrapper
        .findAll("button")
        .find((btn) => btn.text().trim() === "Add");
      expect(addBtn).toBeUndefined();
    });
  });

  describe("US-2.3 — Edit an ingredient", () => {
    it("Signed-in user updates an ingredient", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({ id: 1, token: "test-token", email: "a@example.com" })
      );
      IngredientServices.getIngredients
        .mockResolvedValueOnce({
          data: [{ id: 1, name: "Flour", unit: "cup", pricePerUnit: "0.45" }],
        })
        .mockResolvedValueOnce({
          data: [{ id: 1, name: "Flour", unit: "cup", pricePerUnit: "0.50" }],
        });
      IngredientServices.updateIngredient.mockResolvedValue({
        data: { message: "Ingredient was updated successfully." },
      });

      const wrapper = mountView();
      await flushPromises();

      await wrapper.get("tbody tr .v-icon").trigger("click");
      await flushPromises();

      expect(wrapper.text()).toContain("Edit Ingredient");

      const priceField = wrapper
        .findAllComponents({ name: "VTextField" })
        .find((c) => c.props("label") === "Price Per Unit");
      await priceField.vm.$emit("update:modelValue", 0.5);
      await flushPromises();

      const updateBtn = findButtonByText(wrapper, "Update Ingredient");
      expect(updateBtn).toBeTruthy();
      await updateBtn.trigger("click");
      await flushPromises();

      expect(IngredientServices.updateIngredient).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          name: "Flour",
          pricePerUnit: 0.5,
        })
      );
      expect(wrapper.text()).toContain("0.50");
      expect(wrapper.text()).toContain("updated successfully");
    });
  });
});
