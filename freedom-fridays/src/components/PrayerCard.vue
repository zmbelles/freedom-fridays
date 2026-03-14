<template>
  <article class="card" style="margin-top:14px;">
    <!-- Header -->
    <div style="display:flex; justify-content:space-between; gap:12px; align-items:baseline; flex-wrap:wrap;">
      <h3 style="margin:0; font-size:15px;">{{ prayer.name }}</h3>
      <div style="display:flex; align-items:center; gap:12px;">
        <span class="small">{{ prettyDate }}</span>
        <button v-if="isAdmin" class="delete-btn" title="Delete prayer" @click="deletePrayer">
          Delete Post
        </button>
      </div>
    </div>

    <!-- Body -->
    <p class="sub" style="margin-top:10px; white-space:pre-wrap;">{{ prayer.body }}</p>

    <!-- Comments toggle -->
    <div style="margin-top:14px; border-top:1px solid rgba(215,196,166,.5); padding-top:12px;">
      <button class="btn-text" @click="toggleComments">
        {{ showComments ? "Hide" : "View" }} Comments ({{ prayer.commentCount }})
      </button>
    </div>

    <!-- Comments section -->
    <div v-if="showComments" style="margin-top:14px;">
      <div v-if="commentsLoading" class="small">Loading…</div>
      <div v-else-if="commentsError" class="small" style="color:#b00020;">{{ commentsError }}</div>
      <template v-else>
        <div v-if="comments.length === 0" class="small" style="color:var(--muted);">
          No comments yet. Be the first to pray along.
        </div>
        <div
          v-for="c in comments"
          :key="c._id"
          style="padding:10px 0; border-bottom:1px solid rgba(215,196,166,.3);"
        >
          <div style="display:flex; justify-content:space-between; gap:8px; flex-wrap:wrap; align-items:baseline;">
            <span class="small" style="font-weight:600;">{{ c.name }}</span>
            <div style="display:flex; align-items:center; gap:10px;">
              <span class="small" style="color:var(--muted);">{{ prettyCommentDate(c.createdAt) }}</span>
              <button v-if="isAdmin" class="trash-btn" title="Delete comment" @click="deleteComment(c)">🗑</button>
            </div>
          </div>
          <p class="sub" style="margin:6px 0 0; white-space:pre-wrap;">{{ c.body }}</p>
        </div>
      </template>

      <!-- Add comment form -->
      <form @submit.prevent="submitComment" style="margin-top:16px; display:flex; flex-direction:column; gap:10px;">
        <h4 style="margin:0; font-size:13px; color:var(--muted);">Leave a Comment</h4>
        <input
          v-model="comment.name"
          class="input"
          type="text"
          placeholder="Your name (optional)"
          maxlength="80"
          style="font-size:13px;"
        />
        <textarea
          v-model="comment.body"
          class="input"
          rows="3"
          placeholder="Pray with them…"
          maxlength="1000"
          required
          style="resize:vertical; font-size:13px;"
        ></textarea>
        <p v-if="comment.error" class="small" style="color:#8b2e2e; margin:0;">{{ comment.error }}</p>
        <button type="submit" class="btn" style="align-self:flex-start;" :disabled="comment.loading">
          {{ comment.loading ? "Posting…" : "Post Comment" }}
        </button>
      </form>
    </div>
  </article>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  prayer: { type: Object, required: true },
  isAdmin: { type: Boolean, default: false },
});

const emit = defineEmits(["comment-added", "prayer-deleted"]);

const showComments = ref(false);
const commentsLoading = ref(false);
const commentsError = ref("");
const comments = ref([]);

const comment = ref({ name: "", body: "", loading: false, error: "" });

const prettyDate = computed(() => {
  const d = new Date(props.prayer.createdAt);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
});

function prettyCommentDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

async function loadComments() {
  commentsLoading.value = true;
  commentsError.value = "";
  try {
    const res = await fetch(`/api/prayers/${props.prayer._id}/comments`);
    const data = await res.json();
    comments.value = data.comments || [];
  } catch {
    commentsError.value = "Failed to load comments.";
  } finally {
    commentsLoading.value = false;
  }
}

function toggleComments() {
  showComments.value = !showComments.value;
  if (showComments.value && comments.value.length === 0 && !commentsLoading.value) {
    loadComments();
  }
}

async function deletePrayer() {
  if (!confirm(`Delete this prayer by "${props.prayer.name}"? This will also remove all comments and cannot be undone.`)) return;
  const res = await fetch(`/api/prayers/${props.prayer._id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (res.ok) emit("prayer-deleted", props.prayer._id);
}

async function deleteComment(c) {
  if (!confirm("Delete this comment? This cannot be undone.")) return;
  const res = await fetch(`/api/prayers/${props.prayer._id}/comments/${c._id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (res.ok) {
    comments.value = comments.value.filter((x) => x._id !== c._id);
    props.prayer.commentCount = Math.max(0, (props.prayer.commentCount || 0) - 1);
  }
}

async function submitComment() {
  comment.value.error = "";
  comment.value.loading = true;
  try {
    const res = await fetch(`/api/prayers/${props.prayer._id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: comment.value.name, body: comment.value.body }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to post comment.");
    comment.value.name = "";
    comment.value.body = "";
    emit("comment-added", props.prayer._id);
    await loadComments();
  } catch (e) {
    comment.value.error = e.message;
  } finally {
    comment.value.loading = false;
  }
}
</script>

<style scoped>
.btn-text {
  background: none;
  border: none;
  padding: 0;
  font-family: inherit;
  font-size: 13px;
  color: var(--muted);
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.btn-text:hover {
  color: var(--ink-soft);
}

.delete-btn {
  background: none;
  border: 1px solid rgba(139, 46, 46, 0.4);
  border-radius: 4px;
  padding: 2px 8px;
  font-family: inherit;
  font-size: 11px;
  color: #8b2e2e;
  cursor: pointer;
  white-space: nowrap;
}
.delete-btn:hover {
  background: rgba(139, 46, 46, 0.08);
}

.trash-btn {
  background: none;
  border: none;
  padding: 0 2px;
  font-size: 13px;
  cursor: pointer;
  opacity: 0.5;
  line-height: 1;
}
.trash-btn:hover {
  opacity: 1;
}
</style>
