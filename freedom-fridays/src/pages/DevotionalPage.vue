<template>
  <section v-if="loading" class="card">
    <div class="small">Loading…</div>
  </section>

  <section v-else-if="error" class="card">
    <div class="small" style="color:#b00020;">{{ error }}</div>
  </section>

  <div v-else>
    <PageHeader :title="devotional.title" :subtitle="subtitle" />

    <section class="card" style="margin-top:14px;">
      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:12px;">
        <span v-for="s in devotional.subjects" :key="s" class="pill">{{ s }}</span>
      </div>

      <article class="devotional-body" v-html="devotional.html"></article>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import PageHeader from "../components/PageHeader.vue";
import { fetchDevotionalBySlug } from "../api/devotionals";

const route = useRoute();

const devotional = ref(null);
const loading = ref(false);
const error = ref("");

const subtitle = computed(() => {
  if (!devotional.value) return "";
  const d = devotional.value.date
    ? new Date(devotional.value.date + "T00:00:00").toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";
  const rt = devotional.value.readingTimeMinutes ?? "—";
  return `${d} · ${rt} min read`;
});

async function load() {
  const slug = String(route.params.slug || "");
  if (!slug) return;

  loading.value = true;
  error.value = "";
  devotional.value = null;

  try {
    devotional.value = await fetchDevotionalBySlug(slug);
  } catch (e) {
    error.value = e?.message || "Failed to load devotional.";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(() => route.params.slug, load);
</script>

<style scoped>
.devotional-body :deep(p) {
  margin: 0 0 14px 0;
  line-height: 1.65;
}
.devotional-body :deep(blockquote) {
  margin: 14px 0;
  padding: 10px 14px;
  border-left: 4px solid rgba(255,255,255,0.18);
  background: rgba(255,255,255,0.04);
  border-radius: 10px;
}
.devotional-body :deep(ul),
.devotional-body :deep(ol) {
  margin: 10px 0 14px 20px;
}
.devotional-body :deep(h1),
.devotional-body :deep(h2),
.devotional-body :deep(h3) {
  margin: 18px 0 10px 0;
}
</style>
