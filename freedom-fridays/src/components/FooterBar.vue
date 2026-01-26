<template>
  <footer class="footer">
    <div>© {{ year }} Freedom Fridays</div>
    <div class="muted">Made by <a href="https://www.renderly-consultants.com">Renderly</a> in Vue.js</div>
  </footer>
</template>

<script setup>
const year = new Date().getFullYear();
</script>
