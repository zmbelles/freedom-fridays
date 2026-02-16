import { createRouter, createWebHistory } from "vue-router";
import Home from "../pages/Home.vue";
import About from "../pages/About.vue";
import Devotionals from "../pages/Devotionals.vue";
import DevotionalPage from "../pages/DevotionalPage.vue";

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "home", component: Home },
    { path: "/about", name: "about", component: About },
    {
      path: "/devotionals",
      name: "devotionals",
      component: Devotionals,
    },
    {
      path: "/devotionals/:slug",
      name: "devotional",
      component: DevotionalPage,
    },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});
