export function normalizeSubjects(devotionals) {
  const set = new Set();
  devotionals.forEach(d => (d.subjects || []).forEach(s => set.add(s)));
  return Array.from(set).sort((a,b) => a.localeCompare(b));
}

export function applyDevotionalQuery(devotionals, { search, subject, sort }) {
  const s = (search || "").trim().toLowerCase();

  let rows = devotionals.slice();

  if (subject && subject !== "All") {
    rows = rows.filter(d => (d.subjects || []).includes(subject));
  }

  if (s) {
    rows = rows.filter(d => {
      const hay = [
        d.title,
        d.excerpt,
        (d.subjects || []).join(" "),
        d.date,
      ].join(" ").toLowerCase();
      return hay.includes(s);
    });
  }

  if (sort === "date_desc") rows.sort((a,b) => b.date.localeCompare(a.date));
  if (sort === "date_asc") rows.sort((a,b) => a.date.localeCompare(b.date));
  if (sort === "title_asc") rows.sort((a,b) => (a.title||"").localeCompare(b.title||""));

  return rows;
}
