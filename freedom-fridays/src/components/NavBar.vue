<template>
  <header class="nav">
    <div class="nav-left">
      <p v-if="isLoggedIn" class="welcome-back">Welcome back, Jacob</p>
      <RouterLink to="/" class="brand">
        <div class="brand-title">Freedom Fridays</div>
        <div class="brand-sub">Weekly Christian Devotionals</div>
      </RouterLink>
    </div>

    <nav class="nav-right">
      <div class="nav-meta">
        <button v-if="isLoggedIn" class="nav-login-link" @click="handleLogout">Logout</button>
        <RouterLink v-else to="/login" class="nav-login-link">Login</RouterLink>
      </div>
      <div class="nav-links">
        <RouterLink to="/" class="nav-link" active-class="active">Home</RouterLink>
        <RouterLink to="/about" class="nav-link" active-class="active">About</RouterLink>
        <RouterLink to="/devotionals" class="nav-link" active-class="active">Devotionals</RouterLink>
        <RouterLink to="/prayer-wall" class="nav-link" active-class="active">Prayer Wall</RouterLink>
        <RouterLink v-if="isLoggedIn" to="/upload" class="nav-link" active-class="active">Upload</RouterLink>
      </div>
    </nav>
  </header>
</template>

<script setup>
import { onMounted } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { useAuth } from "../composables/useAuth.js";

const { isLoggedIn, checkAuth, logout } = useAuth();
const router = useRouter();

onMounted(checkAuth);

async function handleLogout() {
  await logout();
  router.push("/");
}
</script>

<style scoped>
.brand {
  text-decoration: none;
  color: inherit;
}

.nav-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.welcome-back {
  font-size: 12px;
  color: var(--muted);
  margin: 0 0 4px;
  font-style: italic;
}

.nav-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.nav-meta {
  line-height: 1;
}

.nav-login-link {
  font-size: 12px;
  color: var(--muted);
  text-decoration: underline;
  text-underline-offset: 3px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-family: inherit;
}

.nav-login-link:hover {
  color: var(--ink-soft);
}

.nav-links {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  align-items: center;
}
</style>
