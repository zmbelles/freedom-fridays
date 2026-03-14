<template>
  <PageHeader title="Upload New Freedom Friday" subtitle="Is it Friday already? Add a new .docx or .odt file using the form below.">
    <form class="upload-form" @submit.prevent="handleSubmit">

      <div class="field">
        <label class="field-label" for="file">File <span class="req">(.docx or .odt)</span></label>
        <input
          id="file"
          ref="fileInput"
          type="file"
          accept=".docx,.odt"
          class="file-input"
          required
          @change="onFileChange"
        />
        <span v-if="fileName" class="file-name small">{{ fileName }}</span>
      </div>

      <div class="field">
        <label class="field-label" for="title">Title <span class="req">(optional — guessed from doc if blank)</span></label>
        <input id="title" v-model="title" class="input" type="text" placeholder="e.g. Freedom in Truth" />
      </div>

      <div class="field">
        <label class="field-label" for="date">Date</label>
        <input id="date" v-model="date" class="input" type="date" />
      </div>

      <div class="field">
        <label class="field-label" for="subjects">Subjects <span class="req">(comma-separated)</span></label>
        <input id="subjects" v-model="subjects" class="input" type="text" placeholder="e.g. Freedom, Faith, Grace" />
      </div>

      <p v-if="error" class="upload-error small">{{ error }}</p>
      <p v-if="success" class="upload-success small">{{ success }}</p>

      <button type="submit" class="btn upload-btn" :disabled="loading">
        {{ loading ? "Uploading…" : "Upload" }}
      </button>
    </form>
  </PageHeader>

  <Teleport to="body">
    <div v-if="duplicate" class="dialog-backdrop" @click.self="duplicate = null">
      <div class="dialog">
        <p class="dialog-msg">
          A Freedom Friday already exists for <strong>{{ date }}</strong>:
        </p>
        <p class="dialog-title">"{{ duplicate.title }}"</p>
        <p class="dialog-msg">Do you still want to upload?</p>
        <div class="dialog-actions">
          <button class="btn" @click="confirmUpload">Yes, upload anyway</button>
          <button class="btn btn-ghost" @click="duplicate = null">Cancel</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from "vue";
import PageHeader from "../components/PageHeader.vue";

const fileInput = ref(null);
const fileName = ref("");
const title = ref("");
const date = ref("");
const subjects = ref("");
const loading = ref(false);
const error = ref("");
const success = ref("");
const duplicate = ref(null);

function onFileChange(e) {
  fileName.value = e.target.files?.[0]?.name || "";
}

async function handleSubmit() {
  error.value = "";
  success.value = "";

  const file = fileInput.value?.files?.[0];
  if (!file) { error.value = "Please select a .docx or .odt file."; return; }

  if (date.value) {
    try {
      const check = await fetch(`/api/devotionals/check-date?date=${date.value}`, { credentials: "include" });
      const data = await check.json();
      if (data.exists) {
        duplicate.value = { title: data.title };
        return;
      }
    } catch { /* non-blocking */ }
  }

  await doUpload();
}

async function confirmUpload() {
  duplicate.value = null;
  await doUpload();
}

async function doUpload() {
  const file = fileInput.value?.files?.[0];
  if (!file) return;

  const form = new FormData();
  form.append("file", file);
  if (title.value.trim()) form.append("title", title.value.trim());
  if (date.value) form.append("date", date.value);
  if (subjects.value.trim()) form.append("subjects", subjects.value.trim());

  loading.value = true;
  try {
    const res = await fetch("/api/devotionals/upload", {
      method: "POST",
      credentials: "include",
      body: form,
    });
    if (!res.ok) {
      if (res.status === 400 || res.status === 401) {
        let msg = "Upload failed.";
        try { msg = (await res.json()).error || msg; } catch { /* non-JSON */ }
        throw new Error(msg);
      }
      throw new Error("__unexpected__");
    }
    const data = await res.json();
    success.value = `Uploaded successfully! Slug: ${data.slug}`;
    fileInput.value.value = "";
    fileName.value = "";
    title.value = "";
    date.value = "";
    subjects.value = "";
  } catch (e) {
    error.value = e.message === "__unexpected__"
      ? "An unexpected error occurred while uploading. Please reach out to Zach at Renderly."
      : e.message;
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.upload-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 20px;
  max-width: 480px;
}

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

.file-input {
  font-family: inherit;
  font-size: 13px;
  color: var(--ink-soft);
  cursor: pointer;
}

.file-name {
  margin-top: 2px;
}

.upload-btn {
  align-self: flex-start;
  margin-top: 4px;
}

.upload-error {
  color: #8b2e2e;
  margin: 0;
}

.upload-success {
  color: #2e6b3e;
  margin: 0;
}

.dialog-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.dialog {
  background: var(--surface, #fff);
  border: 1px solid rgba(215, 196, 166, 0.7);
  border-radius: 8px;
  padding: 28px 32px;
  max-width: 400px;
  width: 90%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dialog-msg {
  margin: 0;
  font-size: 14px;
  color: var(--ink-soft);
}

.dialog-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--ink);
}

.dialog-actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.btn-ghost {
  background: transparent;
  border: 1px solid rgba(215, 196, 166, 0.7);
  color: var(--ink-soft);
}
</style>
