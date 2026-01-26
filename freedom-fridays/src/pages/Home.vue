<template>
  <PageHeader
    title="Freedom Fridays"
    subtitle="A weekly devotional series—published every Friday."
  >
    <div style="margin-top:14px; display:flex; gap:12px; flex-wrap:wrap;">
      <RouterLink to="/devotionals" class="btn" style="text-decoration:none;">Read Devotionals</RouterLink>
      <RouterLink to="/about" class="btn" style="text-decoration:none;">About Mr. Koleczek</RouterLink>
    </div>
  </PageHeader>

  <section class="grid" style="margin-top:14px;">
    <div class="card" style="grid-column: span 7;">
      <h2 style="margin:0 0 8px;">What this is</h2>
      <p class="sub">
        Mr. Koleczek writes 1200–1500 word devotionals each week. This site organizes them by date,
        subject, and search so readers can easily find encouragement.
      </p>
    </div>

    <div class="card" style="grid-column: span 5;">
      <h2 style="margin:0 0 8px;">Publishing cadence</h2>
      <p class="sub">
        New entries appear each Friday. Soon: email subscriptions and topic collections.
      </p>
    </div>
  </section>
</template>

<script setup>
import { RouterLink } from "vue-router";
import PageHeader from "../components/PageHeader.vue";
</script>
