<template>
  <section class="grid" style="margin-top:14px;">
    <div v-if="items.length === 0" class="card" style="grid-column: span 12;">
      <h3 style="margin:0 0 8px;">No results</h3>
      <p class="sub" style="margin:0;">Try clearing the subject filter or changing the search.</p>
    </div>

    <div v-for="d in items" :key="d.id" style="grid-column: span 6;">
      <DevotionalCard :devotional="d" :canDelete="canDelete" @deleted="emit('deleted', $event)" />
    </div>
  </section>
</template>

<script setup>
import DevotionalCard from "./DevotionalCard.vue";

defineProps({
  items: { type: Array, default: () => [] },
  canDelete: { type: Boolean, default: false },
});

const emit = defineEmits(["deleted"]);
</script>
