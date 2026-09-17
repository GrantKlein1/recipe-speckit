/**
 * Feature 5 — Published Recipe Management
 * Spec: features/feature-5-published-recipe-management.md
 */

import { mount, flushPromises } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { createRouter, createMemoryHistory } from "vue-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Login from "../src/views/Login.vue";

vi.mock("../src/services/UserServices", () => ({
  default: {
    loginUser: vi.fn(),
    addUser: vi.fn(),
    logoutUser: vi.fn(),
  },
}));

function makeVuetify() {
  return createVuetify({ components, directives });
}

async function mountLogin() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", name: "login", component: Login },
      {
        path: "/recipes",
        name: "recipes",
        component: { template: "<div>Recipes Page</div>" },
      },
    ],
  });
  await router.push("/");
  await router.isReady();

  const wrapper = mount(Login, {
    global: {
      plugins: [makeVuetify(), router],
    },
  });
  await flushPromises();
  return { wrapper, router };
}

describe("Feature 5 — Published Recipe Management", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("US-5.3 — View published recipes from login", () => {
    it("Visitor opens published recipes from login", async () => {
      expect(localStorage.getItem("user")).toBeNull();

      const { wrapper, router } = await mountLogin();
      const pushSpy = vi.spyOn(router, "push");

      const btn = wrapper
        .findAllComponents({ name: "VBtn" })
        .find((b) => b.text().includes("View Published Recipes"));
      expect(btn).toBeTruthy();

      await btn.find("button").trigger("click");
      await flushPromises();

      expect(pushSpy).toHaveBeenCalledWith({ name: "recipes" });
      const navResult = pushSpy.mock.results[0]?.value;
      if (navResult && typeof navResult.then === "function") {
        await navResult;
      }
      await flushPromises();

      expect(router.currentRoute.value.name).toBe("recipes");
      wrapper.unmount();
    });
  });
});
