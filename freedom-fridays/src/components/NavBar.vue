<template>
  <header class="nav">
    <div class="nav-left">
      <div class="brand">
        <div class="brand-title">Freedom Fridays</div>
        <div class="brand-sub">Weekly Christian Devotionals</div>
      </div>
    </div>

    <nav class="nav-right">
      <RouterLink to="/" class="nav-link" active-class="active">Home</RouterLink>
      <RouterLink to="/about" class="nav-link" active-class="active">About</RouterLink>
      <RouterLink to="/devotionals" class="nav-link" active-class="active">Devotionals</RouterLink>
    </nav>
  </header>
</template>

<script setup>
import { RouterLink } from "vue-router";
</script>
