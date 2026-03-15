<template>
  <footer class="footer">
    <div>© {{ year }} Freedom Fridays</div>
    <button class="subscribe-link" @click="showModal = true">Subscribe for Updates</button>
    <div class="muted">Made by <a href="https://www.renderly-consultants.com">Renderly</a> in Vue.js</div>
  </footer>

  <SubscribeModal v-if="showModal" @close="showModal = false" />
</template>

<script setup>
import { ref } from "vue";
import SubscribeModal from "./SubscribeModal.vue";

const year = new Date().getFullYear();
const showModal = ref(false);
</script>

<style scoped>
.subscribe-link {
  background: none;
  border: none;
  font-family: inherit;
  font-size: inherit;
  color: var(--accent, #7a5c2e);
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.subscribe-link:hover {
  opacity: 0.75;
}
</style>
