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

      <div class="field field-row">
        <input id="notify" v-model="notifySubscribers" type="checkbox" class="checkbox" />
        <label class="field-label" for="notify">Send email notification to subscribers</label>
      </div>

      <p v-if="error" class="upload-error small">{{ error }}</p>
      <p v-if="success" class="upload-success small">{{ success }}</p>
      <p v-if="emailStatus" class="email-status small">{{ emailStatus }}</p>

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
import emailjs from "@emailjs/browser";
import PageHeader from "../components/PageHeader.vue";
import { fetchSubscribers } from "../api/subscribers.js";

const EMAILJS_SERVICE_ID = "service_od2vp4d";
const EMAILJS_TEMPLATE_ID = "template_khkzow8";
// Set VITE_EMAILJS_PUBLIC_KEY in your .env.local file
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

const fileInput = ref(null);
const fileName = ref("");
const title = ref("");
const date = ref("");
const subjects = ref("");
const notifySubscribers = ref(false);
const loading = ref(false);
const error = ref("");
const success = ref("");
const emailStatus = ref("");
const duplicate = ref(null);

function onFileChange(e) {
  fileName.value = e.target.files?.[0]?.name || "";
}

async function handleSubmit() {
  error.value = "";
  success.value = "";
  emailStatus.value = "";

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

    if (notifySubscribers.value) {
      await sendSubscriberEmails(data);
    }

    fileInput.value.value = "";
    fileName.value = "";
    title.value = "";
    date.value = "";
    subjects.value = "";
    notifySubscribers.value = false;
  } catch (e) {
    error.value = e.message === "__unexpected__"
      ? "An unexpected error occurred while uploading. Please reach out to Zach at Renderly."
      : e.message;
  } finally {
    loading.value = false;
  }
}

async function sendSubscriberEmails(uploadData) {
  if (!EMAILJS_PUBLIC_KEY) {
    emailStatus.value = "Email notifications skipped: VITE_EMAILJS_PUBLIC_KEY is not set.";
    return;
  }

  let subscribers;
  try {
    const result = await fetchSubscribers();
    subscribers = result.subscribers || [];
  } catch {
    emailStatus.value = "Could not fetch subscribers — email notifications not sent.";
    return;
  }

  if (subscribers.length === 0) {
    emailStatus.value = "No subscribers to notify.";
    return;
  }

  const siteUrl = window.location.origin;
  const postUrl = `${siteUrl}/devotionals/${uploadData.slug}`;
  const postDate = uploadData.date
    ? new Date(uploadData.date + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "";

  let sent = 0;
  let failed = 0;

  for (const sub of subscribers) {
    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email: sub.email,
          subscriber_name: sub.name || "Friend",
          post_title: uploadData.title || "",
          post_excerpt: uploadData.excerpt || "",
          post_url: postUrl,
          post_date: postDate,
          site_url: siteUrl,
          unsubscribe_url: `${siteUrl}/unsubscribe?token=${sub.token}`,
        },
        { publicKey: EMAILJS_PUBLIC_KEY }
      );
      sent++;
    } catch {
      failed++;
    }
  }

  if (failed === 0) {
    emailStatus.value = `Notified ${sent} subscriber${sent !== 1 ? "s" : ""}.`;
  } else {
    emailStatus.value = `Notified ${sent} subscriber${sent !== 1 ? "s" : ""}; ${failed} failed.`;
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

.field-row {
  flex-direction: row;
  align-items: center;
  gap: 8px;
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

.checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--accent, #7a5c2e);
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

.email-status {
  color: var(--ink-soft);
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
