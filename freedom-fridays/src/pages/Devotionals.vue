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

    <div v-else style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px;">
      <span class="small">
        Showing <strong>{{ pageStart + 1 }}–{{ pageEnd }}</strong> of <strong>{{ filtered.length }}</strong> entries
      </span>

      <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
        <span class="small" style="white-space:nowrap;">Per page:</span>
        <select v-model="perPage" class="select" style="width:auto; padding:6px 10px;">
          <option :value="25">25</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>

        <div style="display:flex; gap:6px;">
          <button class="btn" :disabled="page <= 1" @click="page--">← Prev</button>
          <span class="small" style="align-self:center; white-space:nowrap;">
            Page {{ page }} of {{ totalPages }}
          </span>
          <button class="btn" :disabled="page >= totalPages" @click="page++">Next →</button>
        </div>
      </div>
    </div>
  </section>

  <DevotionalList v-if="!loading && !error" :items="paginated" />

  <section v-if="!loading && !error && totalPages > 1" class="card" style="margin-top:14px;">
    <div style="display:flex; align-items:center; justify-content:center; gap:10px;">
      <button class="btn" :disabled="page <= 1" @click="page--">← Prev</button>
      <span class="small">Page {{ page }} of {{ totalPages }}</span>
      <button class="btn" :disabled="page >= totalPages" @click="page++">Next →</button>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref, computed, watch } from "vue";
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

const perPage = ref(25);
const page = ref(1);

const subjects = computed(() => normalizeSubjects(all.value));

const filtered = computed(() =>
  applyDevotionalQuery(all.value, { search: search.value, subject: subject.value, sort: sort.value })
);

// Reset to page 1 whenever filter/perPage changes
watch([filtered, perPage], () => { page.value = 1; });

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage.value)));
const pageStart = computed(() => (page.value - 1) * perPage.value);
const pageEnd = computed(() => Math.min(pageStart.value + perPage.value, filtered.value.length));
const paginated = computed(() => filtered.value.slice(pageStart.value, pageEnd.value));

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
