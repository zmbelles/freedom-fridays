<template>
  <section class="card">
    <h1 class="h1">{{ title }}</h1>
    <p class="sub" v-if="subtitle">{{ subtitle }}</p>
    <slot />
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: "" },
});
</script>
