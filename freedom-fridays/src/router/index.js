import { createRouter, createWebHistory } from "vue-router";
import Home from "../pages/Home.vue";
import About from "../pages/About.vue";
import Devotionals from "../pages/Devotionals.vue";
import DevotionalPage from "../pages/DevotionalPage.vue";
import Login from "../pages/Login.vue";
import Upload from "../pages/Upload.vue";
import { useAuth } from "../composables/useAuth.js";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "home", component: Home },
    { path: "/about", name: "about", component: About },
    { path: "/login", name: "login", component: Login },
    { path: "/devotionals", name: "devotionals", component: Devotionals },
    { path: "/devotionals/:slug", name: "devotional", component: DevotionalPage },
    { path: "/upload", name: "upload", component: Upload, meta: { requiresAuth: true } },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true;
  const { isLoggedIn, checkAuth } = useAuth();
  await checkAuth();
  if (!isLoggedIn.value) return { name: "login" };
});

export default router;
