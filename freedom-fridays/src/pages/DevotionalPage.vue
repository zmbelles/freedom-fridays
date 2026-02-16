<template>
  <section v-if="loading && !devotional" class="card">
    <div class="small">Loading…</div>
  </section>

  <section v-else-if="error" class="card">
    <div class="small" style="color:#b00020;">{{ error }}</div>
  </section>

  <div v-else-if="devotional">
    <PageHeader :title="devotional.title" :subtitle="subtitle" />

    <section class="card" style="margin-top:14px;">
      <!-- Top actions -->
      <div class="actions-row">
        <button class="btn btn-primary" type="button" @click="goBack">
          ← Back to Devotionals
        </button>

        <div class="actions-right">
          <a :href="docxUrl" download class="btn btn-primary">
            ⬇ Download .docx
          </a>
        </div>
      </div>

      <div style="display:flex; gap:8px; flex-wrap:wrap; margin: 10px 0 12px 0;">
        <span v-for="s in devotional.subjects" :key="s" class="pill">{{ s }}</span>
      </div>

      <article class="devotional-body">
        <div class="docx-shell">
          <!-- Scroll container ONLY wraps doc output -->
          <div ref="scrollBox" class="docx-scroll" @scroll="onScroll">
            <!-- top fade (sticky INSIDE scroll box) -->
            <div
              class="scroll-fade scroll-fade-top"
              :class="{ 'is-on': showTopFade }"
              aria-hidden="true"
            ></div>

            <div ref="docxHost" class="docx-host"></div>

            <!-- bottom fade (sticky INSIDE scroll box) -->
            <div
              class="scroll-fade scroll-fade-bottom"
              :class="{ 'is-on': showBottomFade }"
              aria-hidden="true"
            ></div>
          </div>

          <!-- Top button pinned to shell (not doc flow) -->
          <button
            class="scroll-top"
            :class="{ 'is-on': showScrollTop }"
            type="button"
            title="Back to top"
            @click="scrollToTop"
          >
            ↑ Top
          </button>
        </div>
      </article>
    </section>
  </div>

  <section v-else class="card">
    <div class="small">Loading…</div>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import PageHeader from "../components/PageHeader.vue";
import { fetchDevotionalBySlug } from "../api/devotionals";
import { renderAsync } from "docx-preview";

const route = useRoute();
const router = useRouter();

const devotional = ref(null);
const loading = ref(true);
const error = ref("");

const docxHost = ref(null);
const scrollBox = ref(null);

const showScrollTop = ref(false);
const showTopFade = ref(false);
const showBottomFade = ref(false);

const slug = computed(() => String(route.params.slug || ""));
const docxUrl = computed(() => `/api/devotionals/${encodeURIComponent(slug.value)}/docx`);

const subtitle = computed(() => {
  const dStr = devotional.value?.date;
  let pretty = "—";
  if (dStr) {
    const d = new Date(`${dStr}T00:00:00`);
    if (!Number.isNaN(d.getTime())) {
      pretty = d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    }
  }
  const rt = devotional.value?.readingTimeMinutes ?? "—";
  return `${pretty} · ${rt} min read`;
});

function goBack() {
  if (window.history.length > 1) router.back();
  else router.push({ name: "devotionals" });
}

function calcFadeState() {
  const el = scrollBox.value;
  if (!el) return;

  const top = el.scrollTop;
  const h = el.clientHeight;
  const sh = el.scrollHeight;

  // show top fade once user is not at the top
  showTopFade.value = top > 4;

  // show bottom fade if more content remains
  showBottomFade.value = top + h < sh - 4;

  // show "Top" button after some scrolling
  showScrollTop.value = top > 240;
}

function onScroll() {
  calcFadeState();
}

function scrollToTop() {
  const el = scrollBox.value;
  if (!el) return;
  el.scrollTo({ top: 0, behavior: "smooth" });
}

async function load() {
  if (!slug.value) return;

  loading.value = true;
  error.value = "";
  devotional.value = null;

  try {
    devotional.value = await fetchDevotionalBySlug(slug.value);

    await nextTick();
    if (!docxHost.value || !scrollBox.value) {
      await nextTick();
    }
    if (!docxHost.value || !scrollBox.value) {
      throw new Error("DOCX host/scroll box not mounted.");
    }

    docxHost.value.innerHTML = "";

    const res = await fetch(docxUrl.value);
    if (!res.ok) throw new Error(`Failed to fetch DOCX (HTTP ${res.status})`);

    const arrayBuffer = await res.arrayBuffer();

    await renderAsync(arrayBuffer, docxHost.value, null, {
      className: "docx",
      inWrapper: true,
      ignoreWidth: true,
      ignoreHeight: true,
      ignoreFonts: false,
      breakPages: false,
    });

    // Ensure we compute fades after render + layout
    await nextTick();
    requestAnimationFrame(() => {
      calcFadeState();
    });
  } catch (e) {
    error.value = e?.message || "Failed to load devotional.";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(() => slug.value, load);
</script>

<style scoped>
/* Top action row */
.actions-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

/* Primary style */
.btn-primary {
  background: #8c6a3d;
  color: #fff;
  border: 1px solid #7a5c33;
}
.btn-primary:hover {
  background: #75552f;
  transform: translateY(-1px);
}
.btn-primary:active {
  transform: translateY(0);
}

/* Shell: contains the button and gives us a clean stacking context */
.docx-shell {
  position: relative;
  border-radius: 14px;
  isolation: isolate;

  background: rgba(255, 255, 255, 0.06);
  box-shadow: 0 6px 20px rgba(0,0,0,0.08);
}


/* Scroll container */
.docx-scroll {
  position: relative;
  max-height: calc(100vh - 375px);
  overflow: auto;

  border-radius: 14px;

  /* Remove the fake frame */
  border: none;
  background: transparent;
}


/* Give room so bottom fade doesn’t cover last lines */
.docx-host {
  padding-bottom: 70px;
}

/* Fades: sticky INSIDE the scrollbox so they always align perfectly */
.scroll-fade {
  pointer-events: none;
  position: sticky;
  left: 0;
  right: 0;
  height: 56px;
  z-index: 5;

  opacity: 0;
  transform: translateY(0);
  transition: opacity 180ms ease, transform 180ms ease;
}

/* When enabled, fade in */
.scroll-fade.is-on {
  opacity: 1;
}

/* Top fade: dark-to-transparent downward */
.scroll-fade-top {
  top: 0;
  transform: translateY(-6px);
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.18) 0%,
    rgba(0, 0, 0, 0.10) 35%,
    rgba(0, 0, 0, 0.00) 100%
  );
}
.scroll-fade-top.is-on {
  transform: translateY(0);
}

/* Bottom fade: transparent-to-dark upward */
.scroll-fade-bottom {
  bottom: 0;
  transform: translateY(6px);
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.18) 0%,
    rgba(0, 0, 0, 0.10) 35%,
    rgba(0, 0, 0, 0.00) 100%
  );
}
.scroll-fade-bottom.is-on {
  transform: translateY(0);
}

/* Scroll-to-top button: pinned to shell */
.scroll-top {
  position: absolute;
  right: 20px;
  bottom: 22px;
  z-index: 10;

  padding: 8px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(0, 0, 0, 0.18);
  color: inherit;
  cursor: pointer;

  opacity: 0;
  transform: translateY(6px);
  pointer-events: none;
  transition: opacity 180ms ease, transform 180ms ease;
}
.scroll-top.is-on {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}
.scroll-top:hover {
  background: rgba(0, 0, 0, 0.24);
}

/* Kill docx-preview “stage” */
.docx-host :deep(.docx-wrapper) {
  background: transparent !important;
  padding: 0 !important;
}

/* Remove paper styling + width constraints */
.docx-host :deep(.docx),
.docx-host :deep(.page),
.docx-host :deep(.docx-page) {
  background: transparent !important;
  box-shadow: none !important;
  margin: 0 auto !important;
  width: auto !important;
  max-width: 100% !important;
}

/* Prevent any nested shadows */
.docx-host :deep(*) {
  box-shadow: none !important;
}

/* Keep tables from overflowing */
.docx-host :deep(table) {
  max-width: 100% !important;
}

/* Optional scrollbars */
.docx-scroll::-webkit-scrollbar {
  width: 10px;
}
.docx-scroll::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.18);
  border-radius: 10px;
}
</style>
