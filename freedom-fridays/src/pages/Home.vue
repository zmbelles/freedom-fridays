<template>
  <PageHeader
    title="Freedom Fridays"
    subtitle="A weekly devotional series rooted in the belief that Jesus sets people free."
  />

  <section class="grid" style="margin-top:14px;">
    <div class="card" style="grid-column: span 4;">
      <h2 style="margin:0 0 8px;">Weekly Devotionals</h2>
      <p class="sub">
        Each Friday, Jacob Koleczek publishes a 1200–1500 word devotional drawn from Scripture.
        Browse by date, search by topic, or start from the beginning.
      </p>
      <RouterLink to="/devotionals" class="btn" style="text-decoration:none; display:inline-block; margin-top:14px;">Read Devotionals</RouterLink>
    </div>

    <div class="card" style="grid-column: span 4;">
      <h2 style="margin:0 0 8px;">Prayer Wall</h2>
      <p class="sub">
        Share what's on your heart. The community prays together — submit a prayer request and
        receive encouragement from fellow believers.
      </p>
      <RouterLink to="/prayer-wall" class="btn" style="text-decoration:none; display:inline-block; margin-top:14px;">Prayer Wall</RouterLink>
    </div>

    <div class="card" style="grid-column: span 4;">
      <h2 style="margin:0 0 8px;">The Story Behind This</h2>
      <p class="sub">
        Freedom Fridays started with one man's encounter with grace. Read Jacob's testimony — how
        darkness gave way to something he couldn't explain and couldn't walk away from.
      </p>
      <RouterLink to="/about" class="btn" style="text-decoration:none; display:inline-block; margin-top:14px;">Read His Story</RouterLink>
    </div>
  </section>
</template>

<script setup>
import { RouterLink } from "vue-router";
import PageHeader from "../components/PageHeader.vue";
</script>
