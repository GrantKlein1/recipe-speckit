/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-account-management.md
 */

import { flushPromises, mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MenuBar from "../src/components/MenuBar.vue";
import UserServices from "../src/services/UserServices.js";

vi.mock("../src/services/UserServices.js", () => ({
  default: {
    addUser: vi.fn(),
    loginUser: vi.fn(),
    logoutUser: vi.fn(),
    getUser: vi.fn(),
  },
}));

const sessionUser = {
  id: 1,
  email: "jane@example.com",
  firstName: "Jane",
  lastName: "Doe",
  token: "encrypted-session-token",
};

let wrapper;

async function makeRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", name: "login", component: { template: "<div>Login page</div>" } },
      { path: "/recipes", name: "recipes", component: { template: "<div>Recipes page</div>" } },
      {
        path: "/ingredients",
        name: "ingredients",
        component: { template: "<div>Ingredients page</div>" },
      },
    ],
  });
  await router.push({ name: "recipes" });
  await router.isReady();
  return router;
}

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    wrapper = null;
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
      wrapper = null;
    }
  });

  describe("US-1.4 — Sign out", () => {
    it("User signs out", async () => {
      localStorage.setItem("user", JSON.stringify(sessionUser));
      UserServices.logoutUser.mockResolvedValue({
        data: { message: "Logged out successfully." },
      });

      const router = await makeRouter();
      const pushSpy = vi.spyOn(router, "push");

      wrapper = mount(
        {
          components: { MenuBar },
          template: "<v-app><MenuBar /></v-app>",
        },
        {
          global: {
            plugins: [createVuetify({ components, directives }), router],
            stubs: {
              VMenu: {
                name: "VMenu",
                template: "<div><slot name='activator' :props='{}' /><slot /></div>",
              },
            },
          },
        }
      );
      await flushPromises();

      const logoutButton = wrapper.findAll("button").find((btn) => {
        return btn.text().replace(/\s+/g, " ").trim() === "Logout";
      });
      expect(logoutButton).toBeTruthy();
      await logoutButton.trigger("click");
      await flushPromises();

      expect(UserServices.logoutUser).toHaveBeenCalledTimes(1);
      expect(localStorage.getItem("user")).toBeNull();
      expect(pushSpy).toHaveBeenCalledWith({ name: "login" });
    });
  });
});
