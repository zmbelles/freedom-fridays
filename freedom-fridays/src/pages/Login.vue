<template>
  <PageHeader title="Sign In" subtitle="Welcome back.">
    <form class="login-form" @submit.prevent="handleSubmit" novalidate>
      <div class="field">
        <label class="field-label" for="email">Email</label>
        <input
          id="email"
          v-model.trim="email"
          class="input"
          type="email"
          inputmode="email"
          placeholder="you@example.com"
          autocomplete="email"
          autocapitalize="off"
          autocorrect="off"
          spellcheck="false"
          :disabled="loading"
          required
        />
      </div>

      <div class="field">
        <label class="field-label" for="password">Password</label>
        <input
          id="password"
          v-model="password"
          class="input"
          type="password"
          placeholder="••••••••"
          autocomplete="current-password"
          :disabled="loading"
          required
        />
      </div>

      <p
        v-if="error"
        class="login-error small"
        role="alert"
        aria-live="polite"
      >
        {{ error }}
      </p>

      <button
        type="submit"
        class="btn login-btn"
        :disabled="loading"
        :aria-busy="loading ? 'true' : 'false'"
      >
        {{ loading ? "Signing in…" : "Sign In" }}
      </button>
    </form>
  </PageHeader>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import PageHeader from "../components/PageHeader.vue";
import { useAuth } from "../composables/useAuth.js";

const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 2000;

const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");

const router = useRouter();
const { setLoggedIn } = useAuth();

function getFriendlyErrorMessage(status) {
  switch (status) {
    case 400:
    case 401:
      return "Invalid email or password.";
    case 429:
      return "Too many sign-in attempts. Try again later.";
    case 500:
    case 502:
    case 503:
    case 504:
      return "Unable to sign in right now. Please try again.";
    default:
      return "Sign in failed. Please try again.";
  }
}

function validateForm() {
  const normalizedEmail = String(email.value || "").trim();
  const rawPassword = String(password.value || "");

  if (!normalizedEmail || !rawPassword) {
    return "Email and password are required.";
  }

  if (normalizedEmail.length > MAX_EMAIL_LENGTH) {
    return "Email is too long.";
  }

  if (rawPassword.length > MAX_PASSWORD_LENGTH) {
    return "Password is too long.";
  }

  return "";
}

async function handleSubmit() {
  if (loading.value) {
    return;
  }

  error.value = "";

  const validationError = validateForm();
  if (validationError) {
    error.value = validationError;
    return;
  }

  loading.value = true;

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: String(email.value || "").trim(),
        password: String(password.value || ""),
      }),
    });

    if (!response.ok) {
      password.value = "";
      throw new Error(getFriendlyErrorMessage(response.status));
    }

    setLoggedIn(true);
    await router.push("/");
  } catch (err) {
    error.value =
      err instanceof Error && err.message
        ? err.message
        : "Unable to sign in right now.";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 20px;
  max-width: 380px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 13px;
  color: var(--muted);
}

.input:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.login-btn {
  align-self: flex-start;
  margin-top: 4px;
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.login-error {
  color: #8b2e2e;
  margin: 0;
}
</style>