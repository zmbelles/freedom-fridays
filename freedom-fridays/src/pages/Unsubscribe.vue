<template>
  <PageHeader title="Unsubscribe" subtitle="We'll remove you from the mailing list right away.">
    <div class="unsubscribe-body">
      <p v-if="status === 'loading'" class="status-msg muted">Processing…</p>
      <p v-else-if="status === 'success'" class="status-msg success">
        You've been unsubscribed. You won't receive any more emails from us.
      </p>
      <p v-else-if="status === 'error'" class="status-msg error">
        {{ errorMsg }}
      </p>

      <RouterLink to="/" class="btn home-btn">Back to Home</RouterLink>
    </div>
  </PageHeader>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import PageHeader from "../components/PageHeader.vue";

const route = useRoute();
const status = ref("loading");
const errorMsg = ref("");

onMounted(async () => {
  const token = route.query.token;
  if (!token) {
    status.value = "error";
    errorMsg.value = "No unsubscribe token found. This link may be invalid.";
    return;
  }

  try {
    const res = await fetch(`/api/subscribers/unsubscribe?token=${encodeURIComponent(token)}`);
    if (res.ok) {
      status.value = "success";
    } else {
      const data = await res.json().catch(() => ({}));
      status.value = "error";
      errorMsg.value = data.error || "Something went wrong. Please try again.";
    }
  } catch {
    status.value = "error";
    errorMsg.value = "Could not reach the server. Please try again later.";
  }
});
</script>

<style scoped>
.unsubscribe-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: flex-start;
  margin-top: 20px;
}

.status-msg {
  margin: 0;
  font-size: 15px;
}

.success {
  color: #2e6b3e;
}

.error {
  color: #8b2e2e;
}

.home-btn {
  text-decoration: none;
}
</style>
