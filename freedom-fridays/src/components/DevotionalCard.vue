<template>
  <article class="card">
    <div style="display:flex; justify-content:space-between; gap:12px; align-items:baseline; flex-wrap:wrap;">
      <h3 style="margin:0;">{{ devotional.title }}</h3>
      <div class="small">
        {{ prettyDate }} · {{ devotional.readingTimeMinutes ?? "—" }} min read
      </div>
    </div>

    <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
      <span v-for="s in devotional.subjects" :key="s" class="pill" style="cursor:default;">{{ s }}</span>
    </div>

    <p class="sub" style="margin-top:12px;">
      {{ devotional.excerpt }}
    </p>

    <div style="margin-top:12px;">
      <button class="btn" disabled title="Full devotional pages come next">
        Read (coming soon)
      </button>
    </div>
  </article>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  devotional: { type: Object, required: true },
});

const prettyDate = computed(() => {
  const d = new Date(props.devotional.date + "T00:00:00");
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
});
</script>
