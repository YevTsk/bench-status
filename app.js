(function () {
  "use strict";

  var STORE_KEY = "bench-cards";
  var TAGS_KEY = "bench-tags";
  var TOKEN_KEY = "gh-token";
  var GH = { owner: "YevTsk", repo: "bench-status", branch: "main", path: "data.json" };

  var COLUMNS = [
    { id: "todo", title: "To Do", icon: "queued", chip: "queued" },
    { id: "progress", title: "In Progress", icon: "progress", chip: "progress" },
    { id: "hold", title: "On Hold", icon: "waiting", chip: "waiting" },
    { id: "done", title: "Done", icon: "done", chip: "done" }
  ];

  var ICONS = {
    queued: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>',
    progress: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4l13 8-13 8V4z"/></svg>',
    waiting: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></svg>',
    done: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 12 9 17 20 6"/></svg>'
  };

  var CAL_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';

  var DEFAULT_TAGS = [
    "Anthropic Academy",
    "Internal Initiative",
    "Self-development",
    "AI Tooling",
    "Certification"
  ];

  var SEED = [
    {
      id: "seed-cca",
      column: "progress",
      title: "Claude Code in Action",
      desc: "Hands-on course covering advanced Claude Code workflows, agent patterns, and real-world automation scenarios. Continuation of the completed theory modules.",
      start: "",
      end: "",
      link: "",
      tags: ["Anthropic Academy"]
    },
    {
      id: "seed-community",
      column: "hold",
      title: "AI Community Initiative",
      desc: "Contacted the initiative lead. Awaiting task assignment to begin contribution. Ready to start as soon as scope is defined.",
      start: "",
      end: "",
      link: "",
      tags: ["Internal Initiative"]
    },
    {
      id: "seed-c101",
      column: "done",
      title: "Claude 101",
      desc: "",
      start: "",
      end: "2026-07-06",
      link: "https://verify.skilljar.com/c/ue9st7byj8dq",
      tags: ["Anthropic Academy"]
    },
    {
      id: "seed-cc101",
      column: "done",
      title: "Claude Code 101",
      desc: "",
      start: "",
      end: "2026-07-06",
      link: "https://verify.skilljar.com/c/iwqh6jnffpim",
      tags: ["Anthropic Academy"]
    },
    {
      id: "seed-mcp",
      column: "done",
      title: "Intro to MCP",
      desc: "",
      start: "",
      end: "2026-07-06",
      link: "https://verify.skilljar.com/c/spdpdqbm4bbp",
      tags: ["Anthropic Academy"]
    },
    {
      id: "seed-subagents",
      column: "done",
      title: "Introduction to Subagents",
      desc: "",
      start: "",
      end: "2026-07-06",
      link: "https://verify.skilljar.com/c/93recc4htcdb",
      tags: ["Anthropic Academy"]
    },
    {
      id: "seed-skills",
      column: "done",
      title: "Introduction to Agent Skills",
      desc: "",
      start: "",
      end: "2026-07-06",
      link: "https://verify.skilljar.com/c/qup36p34rpw9",
      tags: ["Anthropic Academy"]
    },
    {
      id: "seed-mcp-adv",
      column: "done",
      title: "Model Context Protocol: Advanced Topics",
      desc: "",
      start: "",
      end: "2026-07-06",
      link: "https://verify.skilljar.com/c/tr6o33rqc4vz",
      tags: ["Anthropic Academy"]
    },
    {
      id: "seed-cv",
      column: "done",
      title: "CV Update & Preparation",
      desc: "Full revision of professional CV — updated project descriptions, skills, and formatting for external positioning.",
      start: "",
      end: "2026-07-03",
      link: "",
      tags: []
    }
  ];

  /* ---------- state ---------- */

  var stored = readStore();
  var state = {
    cards: stored ? stored.cards : SEED.map(clone),
    tags: []
  };
  var dirty = stored ? stored.dirty : false;
  state.tags = loadTags();

  // which columns are collapsed (accordion, mobile only). Done starts collapsed.
  var collapsedCols = { done: true };

  var CHEVRON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';

  function isMobile() {
    return window.matchMedia("(max-width: 600px)").matches;
  }

  function readStore() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return { cards: parsed, dirty: true };
        if (parsed && Array.isArray(parsed.cards)) return { cards: parsed.cards, dirty: !!parsed.dirty };
      }
    } catch (e) {}
    return null;
  }

  function loadTags() {
    var set = [];
    try {
      var raw = localStorage.getItem(TAGS_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) set = parsed;
      }
    } catch (e) {}
    var merged = DEFAULT_TAGS.slice();
    set.forEach(function (t) { if (merged.indexOf(t) === -1) merged.push(t); });
    // pull in any tag already used by a card
    (state && state.cards ? state.cards : SEED).forEach(function (c) {
      (c.tags || []).forEach(function (t) { if (merged.indexOf(t) === -1) merged.push(t); });
    });
    return merged;
  }

  function persist() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ cards: state.cards, dirty: dirty })); } catch (e) {}
  }
  function saveLocal(flag) {
    dirty = !!flag;
    persist();
    updateSaveUI();
    if (flag) {
      setStatus(getToken() ? "Несохранённые изменения" : "Несохранённые изменения — подключите GitHub");
    }
  }
  function saveTags() {
    try { localStorage.setItem(TAGS_KEY, JSON.stringify(state.tags)); } catch (e) {}
  }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function uid() {
    return "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  /* ---------- helpers ---------- */

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

  /* ---------- render ---------- */

  function render() {
    var board = document.getElementById("board");
    if (!board) return;
    board.innerHTML = COLUMNS.map(columnHtml).join("");
    updateCounts();
    updateLastUpdated();
  }

  function columnHtml(col) {
    var cards = state.cards.filter(function (c) { return c.column === col.id; });
    var body = cards.length
      ? cards.map(cardHtml).join("")
      : '<div class="empty-state">Nothing here</div>';

    var addBtn = col.id === "todo"
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

    return '' +
      '<article class="task-card" draggable="true" data-id="' + escapeHtml(card.id) + '">' +
      '  <div class="task-body">' +
      '    <div class="task-name">' + titleInner + '</div>' +
      desc + dates + tags +
      '  </div>' +
      '  <button class="card-edit" data-id="' + escapeHtml(card.id) + '" title="Edit" aria-label="Edit card">' +
      '    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>' +
      '  </button>' +
      '</article>';
  }

  function updateCounts() {
    COLUMNS.forEach(function (col) {
      var n = state.cards.filter(function (c) { return c.column === col.id; }).length;
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

  /* ---------- modal ---------- */

  var editingId = null;
  var selectedTags = null;

  function openModal(cardId, presetCol) {
    editingId = cardId || null;
    var card = cardId ? findCard(cardId) : null;
    selectedTags = {};
    (card && card.tags ? card.tags : []).forEach(function (t) { selectedTags[t] = true; });

    document.getElementById("modal-title").textContent = card ? "Edit card" : "New card";
    var form = document.getElementById("card-form");
    form.title.value = card ? card.title : "";
    form.description.value = card ? card.desc : "";
    form.column.value = card ? card.column : (presetCol || "todo");
    form.start.value = card ? card.start : "";
    form.end.value = card ? card.end : "";
    form.link.value = card ? card.link : "";

    renderTagOptions();
    document.getElementById("delete-card-btn").hidden = !card;
    document.getElementById("new-tag-input").value = "";

    var overlay = document.getElementById("modal-overlay");
    overlay.hidden = false;
    setTimeout(function () { form.title.focus(); }, 30);
  }

  function closeModal() {
    document.getElementById("modal-overlay").hidden = true;
    editingId = null;
    selectedTags = null;
  }

  function renderTagOptions() {
    var wrap = document.getElementById("tag-options");
    wrap.innerHTML = state.tags.map(function (t) {
      var on = selectedTags[t] ? " selected" : "";
      return '<button type="button" class="tag-option' + on + '" data-tag="' + escapeHtml(t) + '">' + escapeHtml(t) + "</button>";
    }).join("");
  }

  function findCard(id) {
    for (var i = 0; i < state.cards.length; i++) {
      if (state.cards[i].id === id) return state.cards[i];
    }
    return null;
  }

  function saveFromForm(e) {
    e.preventDefault();
    var form = document.getElementById("card-form");
    var title = form.title.value.trim();
    if (!title) { form.title.focus(); return; }

    var tags = state.tags.filter(function (t) { return selectedTags[t]; });

    var card = editingId ? findCard(editingId) : null;
    if (card) {
      card.title = title;
      card.desc = form.description.value.trim();
      card.column = form.column.value;
      card.start = form.start.value;
      card.end = form.end.value;
      card.link = form.link.value.trim();
      card.tags = tags;
    } else {
      state.cards.push({
        id: uid(),
        column: form.column.value,
        title: title,
        desc: form.description.value.trim(),
        start: form.start.value,
        end: form.end.value,
        link: form.link.value.trim(),
        tags: tags
      });
    }
    saveLocal(true);
    render();
    closeModal();
  }

  function deleteCurrent() {
    if (!editingId) return;
    state.cards = state.cards.filter(function (c) { return c.id !== editingId; });
    saveLocal(true);
    render();
    closeModal();
  }

  function addCustomTag() {
    var input = document.getElementById("new-tag-input");
    var val = input.value.trim();
    if (!val) return;
    if (state.tags.indexOf(val) === -1) {
      state.tags.push(val);
      saveTags();
    }
    selectedTags[val] = true;
    input.value = "";
    renderTagOptions();
  }

  /* ---------- GitHub publish ---------- */

  function getToken() {
    try { return localStorage.getItem(TOKEN_KEY) || ""; } catch (e) { return ""; }
  }

  function setStatus(msg, isErr) {
    var el = document.getElementById("save-status");
    if (!el) return;
    el.textContent = msg || "";
    el.classList.toggle("error", !!isErr);
  }

  function updateSaveUI() {
    var hasToken = !!getToken();
    var saveBtn = document.getElementById("save-btn");
    var tokenBtn = document.getElementById("token-btn");
    if (saveBtn) saveBtn.hidden = !hasToken;
    if (tokenBtn) tokenBtn.textContent = hasToken ? "GitHub ✓" : "Connect GitHub";
  }

  function b64(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }

  function ghHeaders(token) {
    return {
      "Authorization": "Bearer " + token,
      "Accept": "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28"
    };
  }

  function fetchPublished() {
    return fetch(GH.path, { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (Array.isArray(j)) return j;
        if (j && Array.isArray(j.cards)) return j.cards;
        return null;
      })
      .catch(function () { return null; });
  }

  function ghSave() {
    var token = getToken();
    if (!token) { openTokenModal(); return; }
    setStatus("Сохранение…");
    var api = "https://api.github.com/repos/" + GH.owner + "/" + GH.repo + "/contents/" + GH.path;
    var content = b64(JSON.stringify(state.cards, null, 2));

    fetch(api + "?ref=" + GH.branch, { headers: ghHeaders(token), cache: "no-store" })
      .then(function (r) {
        if (r.status === 200) return r.json();
        if (r.status === 404) return null;
        if (r.status === 401) throw new Error("неверный или просроченный токен");
        throw new Error("HTTP " + r.status);
      })
      .then(function (existing) {
        var body = {
          message: "Update board (" + new Date().toISOString() + ")",
          content: content,
          branch: GH.branch
        };
        if (existing && existing.sha) body.sha = existing.sha;
        return fetch(api, { method: "PUT", headers: ghHeaders(token), body: JSON.stringify(body) });
      })
      .then(function (r) {
        if (!r.ok) {
          return r.json().then(function (e) { throw new Error(e.message || ("HTTP " + r.status)); });
        }
        return r.json();
      })
      .then(function () {
        saveLocal(false);
        setStatus("Сохранено ✓ — обновится по ссылке через ~1 мин");
      })
      .catch(function (err) {
        setStatus("Ошибка: " + err.message, true);
      });
  }

  function openTokenModal() {
    document.getElementById("token-input").value = getToken();
    document.getElementById("token-remove").hidden = !getToken();
    document.getElementById("token-overlay").hidden = false;
    setTimeout(function () { document.getElementById("token-input").focus(); }, 30);
  }
  function closeTokenModal() {
    document.getElementById("token-overlay").hidden = true;
  }
  function saveToken() {
    var val = document.getElementById("token-input").value.trim();
    try {
      if (val) localStorage.setItem(TOKEN_KEY, val);
      else localStorage.removeItem(TOKEN_KEY);
    } catch (e) {}
    updateSaveUI();
    closeTokenModal();
  }
  function removeToken() {
    try { localStorage.removeItem(TOKEN_KEY); } catch (e) {}
    updateSaveUI();
    closeTokenModal();
  }

  /* ---------- drag & drop ---------- */

  var dragEl = null;

  function getDragAfterElement(container, y) {
    var els = [].slice.call(container.querySelectorAll(".task-card:not(.dragging)"));
    var closest = { offset: -Infinity, element: null };
    els.forEach(function (child) {
      var box = child.getBoundingClientRect();
      var offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        closest = { offset: offset, element: child };
      }
    });
    return closest.element;
  }

  function rebuildFromDOM() {
    var byId = {};
    state.cards.forEach(function (c) { byId[c.id] = c; });
    var ordered = [];
    document.querySelectorAll(".board-column-body").forEach(function (body) {
      var colId = body.getAttribute("data-col");
      body.querySelectorAll(".task-card").forEach(function (el) {
        var card = byId[el.getAttribute("data-id")];
        if (card) {
          card.column = colId;
          ordered.push(card);
        }
      });
    });
    if (ordered.length === state.cards.length) state.cards = ordered;
  }

  /* ---------- init / events ---------- */

  function init() {
    render();

    var board = document.getElementById("board");

    board.addEventListener("click", function (e) {
      var add = e.target.closest(".card-add");
      if (add) { openModal(null, add.getAttribute("data-col")); return; }
      var edit = e.target.closest(".card-edit");
      if (edit) { openModal(edit.getAttribute("data-id")); return; }
      var header = e.target.closest(".board-column-header");
      if (header && isMobile()) {
        var colId = header.parentNode.getAttribute("data-col");
        if (collapsedCols[colId]) delete collapsedCols[colId];
        else collapsedCols[colId] = true;
        render();
      }
    });

    board.addEventListener("dragstart", function (e) {
      var card = e.target.closest(".task-card");
      if (!card) return;
      dragEl = card;
      card.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      try { e.dataTransfer.setData("text/plain", card.getAttribute("data-id")); } catch (err) {}
    });

    board.addEventListener("dragend", function () {
      if (dragEl) dragEl.classList.remove("dragging");
      dragEl = null;
      document.querySelectorAll(".board-column-body.drop-target").forEach(function (b) {
        b.classList.remove("drop-target");
      });
    });

    board.addEventListener("dragover", function (e) {
      var body = e.target.closest(".board-column-body");
      if (!body || !dragEl) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      body.classList.add("drop-target");
      var empty = body.querySelector(".empty-state");
      if (empty) empty.remove();
      var after = getDragAfterElement(body, e.clientY);
      if (after == null) body.appendChild(dragEl);
      else body.insertBefore(dragEl, after);
    });

    board.addEventListener("dragleave", function (e) {
      var body = e.target.closest(".board-column-body");
      if (body && !body.contains(e.relatedTarget)) body.classList.remove("drop-target");
    });

    board.addEventListener("drop", function (e) {
      var body = e.target.closest(".board-column-body");
      if (!body) return;
      e.preventDefault();
      body.classList.remove("drop-target");
      rebuildFromDOM();
      saveLocal(true);
      render();
    });

    // modal wiring
    document.getElementById("card-form").addEventListener("submit", saveFromForm);
    document.getElementById("modal-close").addEventListener("click", closeModal);
    document.getElementById("cancel-btn").addEventListener("click", closeModal);
    document.getElementById("delete-card-btn").addEventListener("click", deleteCurrent);
    document.getElementById("add-tag-btn").addEventListener("click", addCustomTag);
    document.getElementById("new-tag-input").addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); addCustomTag(); }
    });
    document.getElementById("tag-options").addEventListener("click", function (e) {
      var opt = e.target.closest(".tag-option");
      if (!opt) return;
      var t = opt.getAttribute("data-tag");
      if (selectedTags[t]) delete selectedTags[t]; else selectedTags[t] = true;
      opt.classList.toggle("selected");
    });
    document.getElementById("modal-overlay").addEventListener("click", function (e) {
      if (e.target === this) closeModal();
    });

    // publish controls
    document.getElementById("token-btn").addEventListener("click", openTokenModal);
    document.getElementById("save-btn").addEventListener("click", ghSave);
    document.getElementById("token-close").addEventListener("click", closeTokenModal);
    document.getElementById("token-cancel").addEventListener("click", closeTokenModal);
    document.getElementById("token-save").addEventListener("click", saveToken);
    document.getElementById("token-remove").addEventListener("click", removeToken);
    document.getElementById("token-overlay").addEventListener("click", function (e) {
      if (e.target === this) closeTokenModal();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (!document.getElementById("modal-overlay").hidden) closeModal();
      if (!document.getElementById("token-overlay").hidden) closeTokenModal();
    });

    updateSaveUI();
    if (dirty) setStatus(getToken() ? "Несохранённые изменения" : "Несохранённые изменения — подключите GitHub");

    // adopt published data.json unless there are local unsaved edits
    fetchPublished().then(function (cards) {
      if (cards && !dirty) {
        state.cards = cards;
        state.tags = loadTags();
        saveLocal(false);
        setStatus("");
        render();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
