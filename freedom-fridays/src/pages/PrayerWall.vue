<template>
  <PageHeader
    title="Prayer Wall"
    subtitle="Share your prayer. We believe in the power of praying together."
  />

  <!-- Submit form -->
  <section class="card" style="margin-top:14px;">
    <h2 style="margin:0 0 14px;">Share a Prayer</h2>
    <form @submit.prevent="submitPrayer" style="display:flex; flex-direction:column; gap:12px; max-width:560px;">
      <div class="field">
        <label class="field-label" for="pname">Your Name <span class="req">(optional)</span></label>
        <input
          id="pname"
          v-model="form.name"
          class="input"
          type="text"
          placeholder="e.g. Sarah, or leave blank for Anonymous"
          maxlength="80"
        />
      </div>
      <div class="field">
        <label class="field-label" for="pbody">Your Prayer <span class="req">(required)</span></label>
        <textarea
          id="pbody"
          v-model="form.body"
          class="input"
          rows="4"
          placeholder="Share what's on your heart…"
          maxlength="2000"
          required
          style="resize:vertical;"
        ></textarea>
        <span class="small" style="text-align:right; color:var(--muted);">{{ form.body.length }}/2000 <span v-if="form.body.length < 50">({{ 50 - form.body.length }} more to go)</span></span>
      </div>
      <p v-if="form.error" class="small" style="color:#8b2e2e; margin:0;">{{ form.error }}</p>
      <p v-if="form.success" class="small" style="color:#2e6b3e; margin:0;">{{ form.success }}</p>
      <button type="submit" class="btn" style="align-self:flex-start;" :disabled="form.loading">
        {{ form.loading ? "Posting…" : "Post Prayer" }}
      </button>
    </form>
  </section>

  <!-- Controls -->
  <section class="card" style="margin-top:14px;">
    <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px;">
      <span class="small">
        Showing <strong>{{ filtered.length === 0 ? 0 : pageStart + 1 }}–{{ pageEnd }}</strong> of <strong>{{ filtered.length }}</strong> prayers
      </span>
      <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
        <select v-model="sort" class="select" style="width:auto; padding:6px 10px;">
          <option value="date_desc">Newest first</option>
          <option value="date_asc">Oldest first</option>
        </select>
        <span class="small" style="white-space:nowrap;">Per page:</span>
        <select v-model="perPage" class="select" style="width:auto; padding:6px 10px;">
          <option :value="25">25</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
        <div style="display:flex; gap:6px;">
          <button class="btn" :disabled="page <= 1" @click="page--">← Prev</button>
          <span class="small" style="align-self:center; white-space:nowrap;">Page {{ page }} of {{ totalPages }}</span>
          <button class="btn" :disabled="page >= totalPages" @click="page++">Next →</button>
        </div>
      </div>
    </div>
  </section>

  <!-- Loading / error -->
  <section v-if="loading" class="card" style="margin-top:14px;">
    <div class="small">Loading prayers…</div>
  </section>
  <section v-else-if="error" class="card" style="margin-top:14px;">
    <div class="small" style="color:#b00020;">{{ error }}</div>
  </section>

  <!-- Prayer cards -->
  <template v-else>
    <div v-if="paginated.length === 0" class="card" style="margin-top:14px;">
      <p class="sub">No prayers yet. Be the first to share one.</p>
    </div>
    <PrayerCard
      v-for="prayer in paginated"
      :key="prayer._id"
      :prayer="prayer"
      :is-admin="isLoggedIn"
      @comment-added="onCommentAdded"
      @prayer-deleted="onPrayerDeleted"
    />
  </template>

  <!-- Bottom pagination -->
  <section v-if="!loading && !error && totalPages > 1" class="card" style="margin-top:14px;">
    <div style="display:flex; align-items:center; justify-content:center; gap:10px;">
      <button class="btn" :disabled="page <= 1" @click="page--">← Prev</button>
      <span class="small">Page {{ page }} of {{ totalPages }}</span>
      <button class="btn" :disabled="page >= totalPages" @click="page++">Next →</button>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import PageHeader from "../components/PageHeader.vue";
import PrayerCard from "../components/PrayerCard.vue";
import { useAuth } from "../composables/useAuth.js";

const { isLoggedIn } = useAuth();

const all = ref([]);
const loading = ref(false);
const error = ref("");

const sort = ref("date_desc");
const perPage = ref(25);
const page = ref(1);

const form = ref({ name: "", body: "", loading: false, error: "", success: "" });

const filtered = computed(() => {
  const list = [...all.value];
  return sort.value === "date_asc"
    ? list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    : list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
});

watch([filtered, perPage], () => { page.value = 1; });

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage.value)));
const pageStart = computed(() => (page.value - 1) * perPage.value);
const pageEnd = computed(() => Math.min(pageStart.value + perPage.value, filtered.value.length));
const paginated = computed(() => filtered.value.slice(pageStart.value, pageEnd.value));

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const res = await fetch("/api/prayers?limit=500");
    const data = await res.json();
    all.value = data.items || [];
  } catch {
    error.value = "Failed to load prayers.";
  } finally {
    loading.value = false;
  }
}

async function submitPrayer() {
  form.value.error = "";
  form.value.success = "";
  if (form.value.body.length < 50) {
    form.value.error = `Prayer must be at least 50 characters (${50 - form.value.body.length} more needed).`;
    return;
  }
  form.value.loading = true;
  try {
    const res = await fetch("/api/prayers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.value.name, body: form.value.body }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to post prayer.");
    form.value.name = "";
    form.value.body = "";
    form.value.success = "Your prayer has been shared. We're praying with you.";
    await load();
  } catch (e) {
    form.value.error = e.message;
  } finally {
    form.value.loading = false;
  }
}

function onCommentAdded(prayerId) {
  const prayer = all.value.find((p) => p._id === prayerId);
  if (prayer) prayer.commentCount = (prayer.commentCount || 0) + 1;
}

function onPrayerDeleted(prayerId) {
  all.value = all.value.filter((p) => p._id !== prayerId);
}

onMounted(load);
</script>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 13px;
  color: var(--muted);
}

.req {
  font-weight: normal;
  opacity: 0.75;
}
</style>
