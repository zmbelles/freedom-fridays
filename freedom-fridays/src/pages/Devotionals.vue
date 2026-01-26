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
    <div class="small">
      Showing <strong>{{ filtered.length }}</strong> of <strong>{{ all.length }}</strong> entries
    </div>
  </section>

  <DevotionalList :items="filtered" />
</template>

<script setup>
import { computed, ref } from "vue";
import PageHeader from "../components/PageHeader.vue";
import DevotionalFilterBar from "../components/DevotionalFilterBar.vue";
import DevotionalList from "../components/DevotionalList.vue";
import { DEVOTIONALS } from "../data/devotionals.mock";
import { normalizeSubjects, applyDevotionalQuery } from "../utils/devotionals";

const all = DEVOTIONALS;

const search = ref("");
const subject = ref("All");
const sort = ref("date_desc");

const subjects = computed(() => normalizeSubjects(all));

const filtered = computed(() =>
  applyDevotionalQuery(all, { search: search.value, subject: subject.value, sort: sort.value })
);
</script>
