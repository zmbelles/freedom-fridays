<template>
  <section class="card" style="margin-top:14px;">
    <div class="grid" style="align-items:end;">
      <div style="grid-column: span 6;">
        <label class="small">Search</label>
        <input class="input" :value="search" @input="$emit('update:search', $event.target.value)" placeholder="Search title, excerpt, subject..." />
      </div>

      <div style="grid-column: span 3;">
        <label class="small">Subject</label>
        <select class="select" :value="subject" @change="$emit('update:subject', $event.target.value)">
          <option>All</option>
          <option v-for="s in subjects" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>

      <div style="grid-column: span 3;">
        <label class="small">Sort</label>
        <select class="select" :value="sort" @change="$emit('update:sort', $event.target.value)">
          <option value="date_desc">Newest → Oldest</option>
          <option value="date_asc">Oldest → Newest</option>
          <option value="title_asc">Title A → Z</option>
        </select>
      </div>
    </div>

    <div style="margin-top:12px; display:flex; gap:8px; flex-wrap:wrap;">
      <div class="small" style="margin-right:8px;">Quick subjects:</div>
      <span
        class="pill"
        :class="{ on: subject === 'All' }"
        @click="$emit('update:subject', 'All')"
      >All</span>

      <span
        v-for="s in subjects.slice(0, 10)"
        :key="s"
        class="pill"
        :class="{ on: subject === s }"
        @click="$emit('update:subject', s)"
      >{{ s }}</span>
    </div>
  </section>
</template>

<script setup>
defineProps({
  search: { type: String, default: "" },
  subject: { type: String, default: "All" },
  sort: { type: String, default: "date_desc" },
  subjects: { type: Array, default: () => [] },
});
defineEmits(["update:search", "update:subject", "update:sort"]);
</script>
