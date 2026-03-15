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

    <div style="margin-top:12px; display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
      <RouterLink class="btn" :to="`/devotionals/${devotional.slug}`">
        Read
      </RouterLink>
      <button
        v-if="canDelete"
        class="btn btn-danger"
        type="button"
        :disabled="deleting"
        @click="handleDelete"
      >
        {{ deleting ? "Deleting…" : "Delete" }}
      </button>
    </div>
  </article>
</template>

<script setup>
import { computed, ref } from "vue";
import { RouterLink } from "vue-router";
import { deleteDevotional } from "../api/devotionals";

const props = defineProps({
  devotional: { type: Object, required: true },
  canDelete: { type: Boolean, default: false },
});

const emit = defineEmits(["deleted"]);

const deleting = ref(false);

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

async function handleDelete() {
  if (!confirm(`Delete "${displayTitle.value}"? This cannot be undone.`)) return;
  deleting.value = true;
  try {
    await deleteDevotional(props.devotional.slug);
    emit("deleted", props.devotional.slug);
  } catch (e) {
    alert(e?.message || "Failed to delete.");
  } finally {
    deleting.value = false;
  }
}
</script>

<style scoped>
.btn-danger {
  background: #b00020;
  color: #fff;
  border: 1px solid #8e001a;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-danger:hover:not(:disabled) {
  background: #8e001a;
}
.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
