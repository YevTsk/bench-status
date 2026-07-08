window.Bench = window.Bench || {};

Bench.render = (function (store) {
  "use strict";

  var COLUMNS = [
    { id: "todo", title: "To Do", icon: "queued" },
    { id: "progress", title: "In Progress", icon: "progress" },
    { id: "hold", title: "On Hold", icon: "waiting" },
    { id: "done", title: "Done", icon: "done" }
  ];

  var ICONS = {
    queued: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>',
    progress: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4l13 8-13 8V4z"/></svg>',
    waiting: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></svg>',
    done: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 12 9 17 20 6"/></svg>'
  };

  var CAL_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
  var CHEVRON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';

  var collapsedCols = { done: true }; // accordion state, mobile only
  var loading = !store.hasLocalData; // true until the first fetchPublished() settles

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fmtDate(iso) {
    if (!iso) return "";
    var d = new Date(iso + "T00:00:00");
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function dateRange(card) {
    var s = fmtDate(card.start);
    var e = fmtDate(card.end);
    if (s && e) return s + " – " + e;
    if (e) return e;
    if (s) return s + " →";
    return "";
  }

  function isMobile() {
    return window.matchMedia("(max-width: 600px)").matches;
  }

  function toggleCollapsed(colId) {
    if (collapsedCols[colId]) delete collapsedCols[colId];
    else collapsedCols[colId] = true;
    render();
  }

  function columnHtml(col) {
    var cards = store.state.cards.filter(function (c) { return c.column === col.id; });
    var emptyText = loading ? "Loading…" : "Clear for now";
    var body = cards.length
      ? cards.map(cardHtml).join("")
      : '<div class="empty-state">' + emptyText + '</div>';

    var addBtn = (col.id === "todo" && store.isOwner())
      ? '<button class="card-add" data-col="' + col.id + '" title="Add card" aria-label="Add card">+</button>'
      : "";

    var collapsed = collapsedCols[col.id] ? " collapsed" : "";

    return '' +
      '<div class="board-column' + collapsed + '" data-col="' + col.id + '">' +
      '  <div class="board-column-header">' +
      '    <div class="board-column-heading">' +
      '      <span class="status-icon ' + col.icon + '">' + ICONS[col.icon] + '</span>' +
      '      <span class="board-column-title">' + escapeHtml(col.title) + '</span>' +
      '    </div>' +
      '    <div class="board-column-tools">' +
      '      <span class="board-column-count">' + cards.length + '</span>' +
      addBtn +
      '      <span class="board-column-chevron">' + CHEVRON + '</span>' +
      '    </div>' +
      '  </div>' +
      '  <div class="board-column-body" data-col="' + col.id + '">' + body + '</div>' +
      '</div>';
  }

  function cardHtml(card) {
    var titleInner = card.link
      ? '<a class="task-name-link" href="' + escapeHtml(card.link) + '" target="_blank" rel="noopener" draggable="false">' + escapeHtml(card.title) + '</a>'
      : escapeHtml(card.title);

    var desc = card.desc
      ? '<div class="task-desc">' + escapeHtml(card.desc) + '</div>'
      : "";

    var range = dateRange(card);
    var dates = range
      ? '<div class="task-dates">' + CAL_ICON + '<span>' + escapeHtml(range) + '</span></div>'
      : "";

    var tags = (card.tags || []).length
      ? '<div class="task-meta">' + card.tags.map(function (t) {
          return '<span class="tag neutral">' + escapeHtml(t) + "</span>";
        }).join("") + "</div>"
      : "";

    var owner = store.isOwner();
    var editBtn = owner
      ? '<button class="card-edit" data-id="' + escapeHtml(card.id) + '" title="Edit" aria-label="Edit card">' +
        '    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>' +
        '  </button>'
      : "";

    return '' +
      '<article class="task-card" draggable="' + owner + '" data-id="' + escapeHtml(card.id) + '">' +
      '  <div class="task-body">' +
      '    <div class="task-name">' + titleInner + '</div>' +
      desc + dates + tags +
      '  </div>' +
      editBtn +
      '</article>';
  }

  function render() {
    var board = document.getElementById("board");
    if (!board) return;
    board.innerHTML = COLUMNS.map(columnHtml).join("");
    updateCounts();
    renderStats();
    updateLastUpdated();
  }

  function renderProfile() {
    var img = document.getElementById("avatar-img");
    var mono = document.getElementById("avatar-mono");
    if (img && mono) {
      var a = store.state.profile && store.state.profile.avatar;
      if (a) { img.src = a; img.hidden = false; mono.hidden = true; }
      else { img.hidden = true; img.removeAttribute("src"); mono.hidden = false; }
    }
    var btn = document.getElementById("avatar-btn");
    if (btn) btn.classList.toggle("editable", store.isOwner());
  }

  function renderStats() {
    var el = document.getElementById("hero-stats");
    if (!el) return;
    var cards = store.state.cards;
    var done = cards.filter(function (c) { return c.column === "done"; }).length;
    var prog = cards.filter(function (c) { return c.column === "progress"; }).length;
    var certs = cards.filter(function (c) { return c.link; }).length;
    var dates = [];
    cards.forEach(function (c) { if (c.start) dates.push(c.start); if (c.end) dates.push(c.end); });
    dates.sort();
    var parts = [];
    parts.push(certs + (certs === 1 ? " certification" : " certifications"));
    parts.push(done + " completed");
    parts.push(prog + " in progress");
    if (dates.length) parts.push("active since " + fmtDate(dates[0]));
    el.textContent = parts.join("  ·  ");
  }

  function updateCounts() {
    COLUMNS.forEach(function (col) {
      var n = store.state.cards.filter(function (c) { return c.column === col.id; }).length;
      var el = document.querySelector('[data-count="' + col.id + '"]');
      if (el) el.textContent = n;
    });
  }

  function updateLastUpdated() {
    var el = document.getElementById("last-updated");
    if (!el) return;
    var now = new Date();
    el.textContent = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }

  function renderTagOptions(selectedTags) {
    var wrap = document.getElementById("tag-options");
    wrap.innerHTML = store.state.tags.map(function (t) {
      var on = selectedTags[t] ? " selected" : "";
      return '<button type="button" class="tag-option' + on + '" data-tag="' + escapeHtml(t) + '">' + escapeHtml(t) + "</button>";
    }).join("");
  }

  function setStatus(msg, isErr) {
    var el = document.getElementById("save-status");
    if (!el) return;
    el.textContent = msg || "";
    el.classList.toggle("error", !!isErr);
  }

  function updateSaveUI() {
    var hasToken = store.isOwner();
    var saveBtn = document.getElementById("save-btn");
    var tokenBtn = document.getElementById("token-btn");
    if (saveBtn) { saveBtn.hidden = !hasToken; saveBtn.disabled = !store.isDirty(); }
    if (tokenBtn) {
      tokenBtn.classList.toggle("connected", hasToken);
      tokenBtn.title = hasToken ? "GitHub connected" : "Connect GitHub";
    }
  }

  function setLoading(v) {
    loading = v;
  }

  return {
    COLUMNS: COLUMNS,
    CAL_ICON: CAL_ICON,
    escapeHtml: escapeHtml,
    fmtDate: fmtDate,
    dateRange: dateRange,
    isMobile: isMobile,
    toggleCollapsed: toggleCollapsed,
    render: render,
    renderProfile: renderProfile,
    renderStats: renderStats,
    renderTagOptions: renderTagOptions,
    setStatus: setStatus,
    updateSaveUI: updateSaveUI,
    setLoading: setLoading
  };
})(Bench.store);
