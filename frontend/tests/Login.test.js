/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-account-management.md
 */

import { flushPromises, mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Login from "../src/views/Login.vue";
import RecipeList from "../src/views/RecipeList.vue";
import UserServices from "../src/services/UserServices.js";
import RecipeServices from "../src/services/RecipeServices.js";

const push = vi.fn();

vi.mock("vue-router", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useRouter: () => ({ push }),
  };
});

vi.mock("../src/services/UserServices.js", () => ({
  default: {
    addUser: vi.fn(),
    loginUser: vi.fn(),
    logoutUser: vi.fn(),
    getUser: vi.fn(),
  },
}));

vi.mock("../src/services/RecipeServices.js", () => ({
  default: {
    getRecipes: vi.fn(),
    getRecipesByUserId: vi.fn(),
    getRecipe: vi.fn(),
    addRecipe: vi.fn(),
    updateRecipe: vi.fn(),
    deleteRecipe: vi.fn(),
  },
}));

const sessionUser = {
  id: 1,
  email: "jane@example.com",
  firstName: "Jane",
  lastName: "Doe",
  token: "encrypted-session-token",
};

const wrappers = [];

const vuetifyStubs = {
  VDialog: {
    name: "VDialog",
    props: ["modelValue"],
    template: '<div v-if="modelValue"><slot /></div>',
  },
  VSnackbar: {
    name: "VSnackbar",
    props: ["modelValue"],
    template: '<div v-if="modelValue"><slot /></div>',
  },
};

function makeVuetify() {
  return createVuetify({ components, directives });
}

function mountLogin() {
  const wrapper = mount(Login, {
    global: {
      plugins: [makeVuetify()],
      stubs: vuetifyStubs,
    },
  });
  wrappers.push(wrapper);
  return wrapper;
}

function mountRecipes() {
  const wrapper = mount(RecipeList, {
    global: {
      plugins: [makeVuetify()],
      stubs: {
        RecipeCard: true,
        RecipeCardComponent: true,
        VSnackbar: vuetifyStubs.VSnackbar,
      },
    },
  });
  wrappers.push(wrapper);
  return wrapper;
}

function visibleInputs(wrapper) {
  return wrapper.findAll("input").filter((input) => input.attributes("type") !== "hidden");
}

async function clickButtonByText(wrapper, label) {
  const button = wrapper.findAll("button").find((btn) => {
    const text = btn.text().replace(/\s+/g, " ").trim();
    return text === label || text.includes(label);
  });
  expect(button).toBeTruthy();
  await button.trigger("click");
  await flushPromises();
}

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(() => {
    localStorage.clear();
    push.mockReset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    while (wrappers.length) {
      const wrapper = wrappers.pop();
      wrapper.unmount();
    }
  });

  describe("US-1.1 — Register an account", () => {
    it("User registers with valid first name, last name, email, and password", async () => {
      UserServices.addUser.mockResolvedValue({ data: sessionUser });

      const wrapper = mountLogin();
      await flushPromises();

      await clickButtonByText(wrapper, "Create Account");

      const inputs = visibleInputs(wrapper);
      await inputs[2].setValue("Jane");
      await inputs[3].setValue("Doe");
      await inputs[4].setValue("jane@example.com");
      await inputs[5].setValue("secret123");

      const createButtons = wrapper
        .findAll("button")
        .filter((btn) => btn.text().replace(/\s+/g, " ").trim() === "Create Account");
      await createButtons.at(-1).trigger("click");
      await flushPromises();

      expect(UserServices.addUser).toHaveBeenCalled();
      expect(JSON.parse(localStorage.getItem("user"))).toMatchObject(sessionUser);
      expect(push).toHaveBeenCalledWith({ name: "recipes" });
      expect(wrapper.text()).toContain("Account created successfully!");
    });

    it("User registers with a duplicate email", async () => {
      UserServices.addUser.mockRejectedValue({
        response: { data: { message: "This email is already in use." } },
      });

      const wrapper = mountLogin();
      await flushPromises();

      await clickButtonByText(wrapper, "Create Account");

      const inputs = visibleInputs(wrapper);
      await inputs[2].setValue("Jane");
      await inputs[3].setValue("Doe");
      await inputs[4].setValue("jane@example.com");
      await inputs[5].setValue("secret123");

      const createButtons = wrapper
        .findAll("button")
        .filter((btn) => btn.text().replace(/\s+/g, " ").trim() === "Create Account");
      await createButtons.at(-1).trigger("click");
      await flushPromises();

      expect(push).not.toHaveBeenCalledWith({ name: "recipes" });
      expect(wrapper.text()).toContain("Login");
      expect(wrapper.text()).toContain("This email is already in use.");
    });
  });

  describe("US-1.2 — Sign in", () => {
    it("User signs in with valid email and password", async () => {
      UserServices.loginUser.mockResolvedValue({ data: sessionUser });

      const wrapper = mountLogin();
      await flushPromises();

      const inputs = visibleInputs(wrapper);
      await inputs[0].setValue("jane@example.com");
      await inputs[1].setValue("secret123");
      await clickButtonByText(wrapper, "Login");

      expect(UserServices.loginUser).toHaveBeenCalled();
      expect(JSON.parse(localStorage.getItem("user"))).toMatchObject(sessionUser);
      expect(push).toHaveBeenCalledWith({ name: "recipes" });
      expect(wrapper.text()).toContain("Login successful!");
    });

    it("User signs in with an unknown email", async () => {
      UserServices.loginUser.mockRejectedValue({
        response: { data: { message: "User not found!" } },
      });

      const wrapper = mountLogin();
      await flushPromises();

      const inputs = visibleInputs(wrapper);
      await inputs[0].setValue("missing@example.com");
      await inputs[1].setValue("any-password");
      await clickButtonByText(wrapper, "Login");

      expect(push).not.toHaveBeenCalledWith({ name: "recipes" });
      expect(wrapper.text()).toContain("Login");
      expect(wrapper.text()).toContain("User not found!");
    });

    it("User signs in with an invalid password", async () => {
      UserServices.loginUser.mockRejectedValue({
        response: { data: { message: "Invalid password!" } },
      });

      const wrapper = mountLogin();
      await flushPromises();

      const inputs = visibleInputs(wrapper);
      await inputs[0].setValue("jane@example.com");
      await inputs[1].setValue("wrong-password");
      await clickButtonByText(wrapper, "Login");

      expect(push).not.toHaveBeenCalledWith({ name: "recipes" });
      expect(wrapper.text()).toContain("Login");
      expect(wrapper.text()).toContain("Invalid password!");
    });
  });

  describe("US-1.3 — Stay signed in across page loads", () => {
    it("Signed-in user remains signed in after a page refresh", async () => {
      localStorage.setItem("user", JSON.stringify(sessionUser));
      RecipeServices.getRecipesByUserId.mockResolvedValue({ data: [] });

      const firstView = mountRecipes();
      await flushPromises();

      expect(firstView.text()).toContain("Recipes");
      expect(firstView.text()).not.toContain("View Published Recipes");
      expect(JSON.parse(localStorage.getItem("user"))).toMatchObject(sessionUser);

      firstView.unmount();

      const refreshed = mountRecipes();
      await flushPromises();

      expect(refreshed.text()).toContain("Recipes");
      expect(refreshed.text()).not.toContain("Email");
      expect(JSON.parse(localStorage.getItem("user"))).toMatchObject(sessionUser);
      expect(RecipeServices.getRecipesByUserId).toHaveBeenCalledWith(sessionUser.id);
    });
  });

  describe("US-1.5 — Guard private screens; allow guest published recipes", () => {
    it("Guest views published recipes without signing in", async () => {
      RecipeServices.getRecipes.mockResolvedValue({
        data: [{ id: 1, name: "Public Soup", isPublished: true }],
      });

      const login = mountLogin();
      await flushPromises();

      expect(localStorage.getItem("user")).toBeNull();
      await clickButtonByText(login, "View Published Recipes");

      expect(push).toHaveBeenCalledWith({ name: "recipes" });
      expect(localStorage.getItem("user")).toBeNull();
      expect(UserServices.loginUser).not.toHaveBeenCalled();

      login.unmount();

      const recipes = mountRecipes();
      await flushPromises();

      expect(recipes.text()).toContain("Recipes");
      expect(RecipeServices.getRecipes).toHaveBeenCalled();
      expect(RecipeServices.getRecipesByUserId).not.toHaveBeenCalled();
    });
  });
});
