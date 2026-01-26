<template>
  <PageHeader
    title="About"
    subtitle="Why Freedom Fridays exists and who it’s for."
  />

  <section class="card" style="margin-top:14px;">
    <h2 style="margin:0 0 10px;">The story</h2>
    <p class="sub">
      Freedom Fridays began as a weekly habit—one devotional each Friday—shared with coworkers and friends.
      After consistent feedback to publish them, the collection is now being organized here for easy reading.
    </p>

    <hr style="border:none; border-top:1px solid rgba(215,196,166,.7); margin:16px 0;">

    <h3 style="margin:0 0 8px;">Coming soon</h3>
    <ul class="sub" style="margin:0; padding-left:18px;">
      <li>Search by subject and keyword</li>
      <li>Login for Mr. Koleczek</li>
      <li>DOCX upload → devotional page conversion</li>
      <li>MongoDB-backed archive</li>
    </ul>
  </section>
</template>

<script setup>
import PageHeader from "../components/PageHeader.vue";
</script>
