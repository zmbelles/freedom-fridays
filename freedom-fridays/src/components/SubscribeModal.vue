<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click.self="$emit('close')">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="subscribe-title">
        <button class="modal-close" aria-label="Close" @click="$emit('close')">✕</button>

        <h2 id="subscribe-title" class="modal-title">Stay in the Word</h2>
        <p class="modal-subtitle">Get notified by email whenever a new Freedom Friday is posted.</p>

        <form v-if="!submitted" class="subscribe-form" @submit.prevent="handleSubmit">
          <div class="field">
            <label class="field-label" for="sub-name">Name <span class="opt">(optional)</span></label>
            <input id="sub-name" v-model="name" class="input" type="text" placeholder="Your name" autocomplete="name" />
          </div>
          <div class="field">
            <label class="field-label" for="sub-email">Email <span class="req">*</span></label>
            <input id="sub-email" v-model="email" class="input" type="email" placeholder="you@example.com" required autocomplete="email" />
          </div>

          <p v-if="error" class="form-error small">{{ error }}</p>

          <button type="submit" class="btn subscribe-btn" :disabled="loading">
            {{ loading ? "Subscribing…" : "Subscribe" }}
          </button>
        </form>

        <div v-else class="success-state">
          <p class="success-msg">You're subscribed! You'll hear from us next Friday.</p>
          <button class="btn" @click="$emit('close')">Close</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from "vue";
import { subscribe } from "../api/subscribers.js";

defineEmits(["close"]);

const name = ref("");
const email = ref("");
const loading = ref(false);
const error = ref("");
const submitted = ref(false);

async function handleSubmit() {
  error.value = "";
  loading.value = true;
  try {
    await subscribe({ name: name.value, email: email.value });
    submitted.value = true;
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal {
  position: relative;
  background: var(--surface, #fdf8f0);
  border: 1px solid rgba(215, 196, 166, 0.7);
  border-radius: 8px;
  padding: 32px;
  max-width: 420px;
  width: 90%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-close {
  position: absolute;
  top: 14px;
  right: 16px;
  background: none;
  border: none;
  font-size: 16px;
  color: var(--muted);
  cursor: pointer;
  padding: 4px;
  line-height: 1;
}

.modal-close:hover {
  color: var(--ink);
}

.modal-title {
  margin: 0;
  font-size: 20px;
  color: var(--ink);
}

.modal-subtitle {
  margin: 0;
  font-size: 14px;
  color: var(--ink-soft);
}

.subscribe-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 4px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.field-label {
  font-size: 13px;
  color: var(--muted);
}

.req {
  color: #8b2e2e;
}

.opt {
  font-weight: normal;
  opacity: 0.7;
}

.subscribe-btn {
  align-self: flex-start;
  margin-top: 2px;
}

.form-error {
  color: #8b2e2e;
  margin: 0;
}

.success-state {
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: flex-start;
}

.success-msg {
  margin: 0;
  font-size: 15px;
  color: #2e6b3e;
}
</style>
