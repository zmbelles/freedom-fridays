import { ref } from "vue";

// module-level singletons so all components share the same state
const isLoggedIn = ref(false);
const checked = ref(false);

export function useAuth() {
  async function checkAuth() {
    if (checked.value) return;
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      isLoggedIn.value = res.ok;
    } catch {
      isLoggedIn.value = false;
    } finally {
      checked.value = true;
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    isLoggedIn.value = false;
  }

  function setLoggedIn(val) {
    isLoggedIn.value = val;
    checked.value = true;
  }

  return { isLoggedIn, checkAuth, logout, setLoggedIn };
}
