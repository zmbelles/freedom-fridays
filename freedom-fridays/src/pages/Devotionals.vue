<template>
  <PageHeader
    title="Devotionals"
    subtitle="Browse by date, subject, or search. Full devotional pages and archives are coming next."
  />

  <DevotionalFilterBar
    v-model:search="search"
    v-model:subject="subject"
    v-model:sort="sort"
    :subjects="subjects"
  />

  <section class="card" style="margin-top:14px;">
    <div class="small" v-if="loading">Loading devotionals…</div>

    <div class="small" v-else-if="error" style="color:#b00020;">
      {{ error }}
    </div>

    <div class="small" v-else>
      Showing <strong>{{ filtered.length }}</strong> of <strong>{{ all.length }}</strong> entries
    </div>
  </section>

  <DevotionalList v-if="!loading && !error" :items="filtered" />
</template>

<script setup>
  import { onMounted, ref, computed } from "vue";
  import { fetchDevotionals } from "../api/devotionals";
  import { normalizeSubjects, applyDevotionalQuery } from "../utils/devotionals";
  import PageHeader from "../components/PageHeader.vue";
  import DevotionalFilterBar from "../components/DevotionalFilterBar.vue";
  import DevotionalList from "../components/DevotionalList.vue";

  const all = ref([]);
  const loading = ref(false);
  const error = ref("");

  const search = ref("");
  const subject = ref("All");
  const sort = ref("date_desc");

  const subjects = computed(() => normalizeSubjects(all.value));
  const filtered = computed(() =>
    applyDevotionalQuery(all.value, { search: search.value, subject: subject.value, sort: sort.value })
  );

  async function load() {
    loading.value = true;
    error.value = "";
    try {
      const { items } = await fetchDevotionals({ limit: 200 });
      all.value = items;
    } catch (e) {
      error.value = e?.message || "Failed to load devotionals.";
    } finally {
      loading.value = false;
    }
  }

  onMounted(load);
</script>
