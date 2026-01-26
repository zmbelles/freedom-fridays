import { createRouter, createWebHistory } from "vue-router";
import Home from "../pages/Home.vue";
import About from "../pages/About.vue";
import Devotionals from "../pages/Devotionals.vue";

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "home", component: Home },
    { path: "/about", name: "about", component: About },
    { path: "/devotionals", name: "devotionals", component: Devotionals },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});
