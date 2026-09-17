/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-account-management.md
 */

import { beforeEach, describe, expect, it } from "vitest";
import router from "../src/router.js";

describe("Feature 1 — User Authentication & Session Management", () => {
  describe("US-1.5 — Guard private screens; allow guest published recipes", () => {
    beforeEach(async () => {
      localStorage.clear();
      await router.push({ name: "login" });
      await router.isReady();
    });

    it("Unauthenticated user is redirected from ingredients to login", async () => {
      await router.push({ name: "ingredients" });
      expect(router.currentRoute.value.name).toBe("login");
    });

    it("Unauthenticated user is redirected from edit recipe to login", async () => {
      await router.push({ name: "editRecipe", params: { id: "1" } });
      expect(router.currentRoute.value.name).toBe("login");
    });
  });
});
