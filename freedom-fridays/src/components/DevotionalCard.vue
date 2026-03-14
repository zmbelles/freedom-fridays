<template>
  <article class="card">
    <div style="display:flex; justify-content:space-between; gap:12px; align-items:baseline; flex-wrap:wrap;">
      <h3 style="margin:0;">{{ displayTitle }}</h3>
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
      <RouterLink class="btn" :to="`/devotionals/${devotional.slug}`">
        Read
      </RouterLink>
    </div>
  </article>
</template>

<script setup>
import { computed } from "vue";
import { RouterLink } from "vue-router";

const props = defineProps({
  devotional: { type: Object, required: true },
});

const prettyDate = computed(() => {
  const dateStr = props.devotional?.date;
  if (!dateStr) return "—";
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
});

// If the title is just the raw filename pattern "FF M-D-YY", show the formatted date instead.
const displayTitle = computed(() => {
  const t = props.devotional?.title || "";
  if (/^FF\s+\d{1,2}-\d{1,2}-\d{2}$/i.test(t.trim())) return prettyDate.value;
  return t;
});
</script>
