async function httpJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchDevotionals({ q = "", subject = "All", sort = "date_desc", limit = 200 } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (subject && subject !== "All") params.set("subject", subject);
  if (sort) params.set("sort", sort);
  params.set("limit", String(limit));
  return httpJson(`/api/devotionals?${params.toString()}`);
}

export async function fetchDevotionalBySlug(slug) {
  return httpJson(`/api/devotionals/${encodeURIComponent(slug)}`);
}
