window.Bench = window.Bench || {};

Bench.store = (function () {
  "use strict";

  var STORE_KEY = "bench-cards";
  var TAGS_KEY = "bench-tags";
  var TOKEN_KEY = "gh-token";
  var GH = { owner: "YevTsk", repo: "bench-status", branch: "main", path: "data.json" };
  var RAW_URL = "https://raw.githubusercontent.com/" + GH.owner + "/" + GH.repo + "/" + GH.branch + "/" + GH.path;

  var DEFAULT_TAGS = [
    "Anthropic Academy",
    "Internal Initiative",
    "Self-development",
    "AI Tooling",
    "Certification"
  ];

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function uid() {
    return "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function findCard(id) {
    for (var i = 0; i < state.cards.length; i++) {
      if (state.cards[i].id === id) return state.cards[i];
    }
    return null;
  }

  function readStore() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return { cards: parsed, dirty: true, profile: {} };
        if (parsed && Array.isArray(parsed.cards)) return { cards: parsed.cards, dirty: !!parsed.dirty, profile: parsed.profile || {} };
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
    state.cards.forEach(function (c) {
      (c.tags || []).forEach(function (t) { if (merged.indexOf(t) === -1) merged.push(t); });
    });
    return merged;
  }

  function persist() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ cards: state.cards, profile: state.profile, dirty: dirty })); } catch (e) {}
  }

  function saveTags() {
    try { localStorage.setItem(TAGS_KEY, JSON.stringify(state.tags)); } catch (e) {}
  }

  function markDirty(flag) {
    dirty = !!flag;
    persist();
  }

  function isDirty() {
    return dirty;
  }

  function getToken() {
    try { return localStorage.getItem(TOKEN_KEY) || ""; } catch (e) { return ""; }
  }

  function setToken(val) {
    try {
      if (val) localStorage.setItem(TOKEN_KEY, val);
      else localStorage.removeItem(TOKEN_KEY);
    } catch (e) {}
  }

  function isOwner() {
    return !!getToken();
  }

  var stored = readStore();
  var state = {
    cards: stored ? stored.cards : [],
    tags: [],
    profile: stored && stored.profile ? stored.profile : { avatar: "" }
  };
  var dirty = stored ? stored.dirty : false;
  state.tags = loadTags();

  /* ---------- GitHub sync ---------- */

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

  function parsePayload(j) {
    if (!j) return null;
    if (Array.isArray(j)) return { cards: j, profile: {} };
    if (Array.isArray(j.cards)) return { cards: j.cards, profile: j.profile || {} };
    return null;
  }

  function fetchJson(url) {
    return fetch(url, { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(parsePayload)
      .catch(function () { return null; });
  }

  function fetchPublished() {
    // same-origin file first (live site); fall back to GitHub raw for local file:// use
    return fetchJson(GH.path).then(function (p) {
      return p || fetchJson(RAW_URL + "?t=" + Date.now());
    });
  }

  function publish() {
    var token = getToken();
    if (!token) return Promise.reject(new Error("no token"));
    var api = "https://api.github.com/repos/" + GH.owner + "/" + GH.repo + "/contents/" + GH.path;
    var content = b64(JSON.stringify({ profile: state.profile, cards: state.cards }, null, 2));

    return fetch(api + "?ref=" + GH.branch, { headers: ghHeaders(token), cache: "no-store" })
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
        markDirty(false);
      });
  }

  return {
    state: state,
    hasLocalData: !!stored,
    DEFAULT_TAGS: DEFAULT_TAGS,
    clone: clone,
    uid: uid,
    findCard: findCard,
    loadTags: loadTags,
    saveTags: saveTags,
    markDirty: markDirty,
    isDirty: isDirty,
    getToken: getToken,
    setToken: setToken,
    isOwner: isOwner,
    fetchPublished: fetchPublished,
    publish: publish
  };
})();
