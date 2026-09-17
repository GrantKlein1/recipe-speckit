import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "login",
      component: () => import("./views/Login.vue"),
    },
    {
      path: "/recipes",
      name: "recipes",
      component: () => import("./views/RecipeList.vue"),
    },
    {
      path: "/recipe/:id",
      name: "editRecipe",
      props: true,
      meta: { requiresAuth: true },
      component: () => import("./views/EditRecipe.vue"),
    },
    {
      path: "/ingredients",
      name: "ingredients",
      meta: { requiresAuth: true },
      component: () => import("./views/IngredientList.vue"),
    },
  ],
});

function hasStoredSession() {
  const raw = localStorage.getItem("user");
  if (raw === null) {
    return false;
  }
  const session = JSON.parse(raw);
  return session !== null && Boolean(session.token);
}

router.beforeEach((to) => {
  const signedIn = hasStoredSession();
  if (to.name === "login" && signedIn) {
    return { name: "recipes" };
  }
  if (to.meta.requiresAuth && !signedIn) {
    return { name: "login" };
  }
  return true;
});

export default router;
