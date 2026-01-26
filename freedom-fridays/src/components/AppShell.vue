<template>
  <div class="parchment-root">
    <div class="parchment-overlay" aria-hidden="true"></div>

    <div class="container">
      <NavBar />
      <main class="main">
        <slot />
      </main>
      <FooterBar />
    </div>
  </div>
</template>

<script setup>
import NavBar from "./NavBar.vue";
import FooterBar from "./FooterBar.vue";
</script>
