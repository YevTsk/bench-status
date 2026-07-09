(function (store, view) {
  "use strict";

  function markDirty(flag) {
    store.markDirty(flag);
    view.updateSaveUI();
    if (flag) view.setStatus(store.getToken() ? "Несохранённые изменения" : "Несохранённые изменения — подключите GitHub");
  }

  /* ---------- modal (add/edit card) ---------- */

  var editingId = null;
  var selectedTags = null;

  function openModal(cardId, presetCol) {
    editingId = cardId || null;
    var card = cardId ? store.findCard(cardId) : null;
    selectedTags = {};
    (card && card.tags ? card.tags : []).forEach(function (t) { selectedTags[t] = true; });

    document.getElementById("modal-title").textContent = card ? "Edit card" : "New card";
    var form = document.getElementById("card-form");
    form.title.value = card ? card.title : "";
    form.description.value = card ? card.desc : "";
    form.column.value = card ? card.column : (presetCol || "todo");
    form.start.value = card ? card.start : "";
    form.end.value = card ? card.end : "";
    form.end.min = form.start.value;
    form.start.max = form.end.value;
    form.link.value = card ? card.link : "";

    view.renderTagOptions(selectedTags);
    document.getElementById("delete-card-btn").hidden = !card;
    document.getElementById("new-tag-input").value = "";

    document.getElementById("modal-overlay").hidden = false;
    setTimeout(function () { form.title.focus(); }, 30);
  }

  function closeModal() {
    document.getElementById("modal-overlay").hidden = true;
    editingId = null;
    selectedTags = null;
  }

  function saveFromForm(e) {
    e.preventDefault();
    var form = document.getElementById("card-form");
    var title = form.title.value.trim();
    if (!title) { form.title.focus(); return; }

    var tags = store.state.tags.filter(function (t) { return selectedTags[t]; });

    var card = editingId ? store.findCard(editingId) : null;
    if (card) {
      card.title = title;
      card.desc = form.description.value.trim();
      card.column = form.column.value;
      card.start = form.start.value;
      card.end = form.end.value;
      card.link = form.link.value.trim();
      card.tags = tags;
    } else {
      store.state.cards.push({
        id: store.uid(),
        column: form.column.value,
        title: title,
        desc: form.description.value.trim(),
        start: form.start.value,
        end: form.end.value,
        link: form.link.value.trim(),
        tags: tags
      });
    }
    markDirty(true);
    view.render();
    closeModal();
  }

  function deleteCurrent() {
    if (!editingId) return;
    store.state.cards = store.state.cards.filter(function (c) { return c.id !== editingId; });
    markDirty(true);
    view.render();
    closeModal();
  }

  function addCustomTag() {
    var input = document.getElementById("new-tag-input");
    var val = input.value.trim();
    if (!val) return;
    if (store.state.tags.indexOf(val) === -1) {
      store.state.tags.push(val);
      store.saveTags();
    }
    selectedTags[val] = true;
    input.value = "";
    view.renderTagOptions(selectedTags);
  }

  /* ---------- card detail (view) ---------- */

  var viewId = null;

  function openView(id) {
    var c = store.findCard(id);
    if (!c) return;
    viewId = id;
    document.getElementById("view-title").textContent = c.title;

    var html = "";
    if (c.desc) html += '<p class="view-desc">' + view.escapeHtml(c.desc) + "</p>";
    var range = view.dateRange(c);
    if (range) html += '<div class="view-dates">' + view.CAL_ICON + "<span>" + view.escapeHtml(range) + "</span></div>";
    if ((c.tags || []).length) {
      html += '<div class="task-meta">' + c.tags.map(function (t) {
        return '<span class="tag neutral">' + view.escapeHtml(t) + "</span>";
      }).join("") + "</div>";
    }
    if (c.link) html += '<a class="view-link" href="' + view.escapeHtml(c.link) + '" target="_blank" rel="noopener">Open link →</a>';
    if (!html) html = '<p class="view-desc" style="color:var(--muted)">No details</p>';

    document.getElementById("view-body").innerHTML = html;
    document.getElementById("view-edit").hidden = !store.isOwner();
    document.getElementById("view-overlay").hidden = false;
  }

  function closeView() {
    document.getElementById("view-overlay").hidden = true;
    viewId = null;
  }

  /* ---------- avatar upload (owner only) ---------- */

  function loadAvatar(file) {
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var max = 160;
        var scale = Math.min(1, max / Math.max(img.width, img.height));
        var w = Math.round(img.width * scale);
        var h = Math.round(img.height * scale);
        var c = document.createElement("canvas");
        c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        store.state.profile.avatar = c.toDataURL("image/jpeg", 0.85);
        markDirty(true);
        view.renderProfile();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  /* ---------- GitHub token modal ---------- */

  function openTokenModal() {
    document.getElementById("token-input").value = store.getToken();
    document.getElementById("token-remove").hidden = !store.getToken();
    document.getElementById("token-overlay").hidden = false;
    setTimeout(function () { document.getElementById("token-input").focus(); }, 30);
  }
  function closeTokenModal() {
    document.getElementById("token-overlay").hidden = true;
  }
  function saveToken() {
    store.setToken(document.getElementById("token-input").value.trim());
    view.updateSaveUI();
    view.renderProfile();
    view.render();
    closeTokenModal();
  }
  function removeToken() {
    store.setToken("");
    view.updateSaveUI();
    view.renderProfile();
    view.render();
    closeTokenModal();
  }

  function handleSaveClick() {
    if (!store.getToken()) { openTokenModal(); return; }
    view.setStatus("Сохранение…");
    store.publish()
      .then(function () {
        markDirty(false);
        view.setStatus("Сохранено ✓ — обновится по ссылке через ~1 мин");
      })
      .catch(function (err) {
        view.setStatus("Ошибка: " + err.message, true);
      });
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
    store.state.cards.forEach(function (c) { byId[c.id] = c; });
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
    if (ordered.length === store.state.cards.length) store.state.cards = ordered;
  }

  /* ---------- init / events ---------- */

  function init() {
    view.render();

    var board = document.getElementById("board");

    board.addEventListener("click", function (e) {
      var add = e.target.closest(".card-add");
      if (add) { if (store.isOwner()) openModal(null, add.getAttribute("data-col")); return; }
      var edit = e.target.closest(".card-edit");
      if (edit) { if (store.isOwner()) openModal(edit.getAttribute("data-id")); return; }
      var header = e.target.closest(".board-column-header");
      if (header && view.isMobile()) {
        view.toggleCollapsed(header.parentNode.getAttribute("data-col"));
        return;
      }
      if (e.target.closest(".task-name-link")) return; // let the link navigate
      var card = e.target.closest(".task-card");
      if (card) { openView(card.getAttribute("data-id")); return; }
    });

    board.addEventListener("dragstart", function (e) {
      if (!store.isOwner()) { e.preventDefault(); return; }
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
      markDirty(true);
      view.render();
    });

    // modal wiring
    document.getElementById("card-form").addEventListener("submit", saveFromForm);
    document.getElementById("card-form").start.addEventListener("change", function (e) {
      document.getElementById("card-form").end.min = e.target.value;
    });
    document.getElementById("card-form").end.addEventListener("change", function (e) {
      document.getElementById("card-form").start.max = e.target.value;
    });
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

    // publish controls
    document.getElementById("token-btn").addEventListener("click", openTokenModal);
    document.getElementById("save-btn").addEventListener("click", handleSaveClick);
    document.getElementById("token-close").addEventListener("click", closeTokenModal);
    document.getElementById("token-cancel").addEventListener("click", closeTokenModal);
    document.getElementById("token-save").addEventListener("click", saveToken);
    document.getElementById("token-remove").addEventListener("click", removeToken);

    // card detail (view) controls
    document.getElementById("view-close").addEventListener("click", closeView);
    document.getElementById("view-close2").addEventListener("click", closeView);
    document.getElementById("view-edit").addEventListener("click", function () {
      var id = viewId;
      closeView();
      if (id) openModal(id);
    });
    document.getElementById("view-overlay").addEventListener("click", function (e) {
      if (e.target === this) closeView();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (!document.getElementById("modal-overlay").hidden) closeModal();
      if (!document.getElementById("token-overlay").hidden) closeTokenModal();
      if (!document.getElementById("view-overlay").hidden) closeView();
    });

    // avatar upload (owner only)
    var avatarBtn = document.getElementById("avatar-btn");
    var avatarInput = document.getElementById("avatar-input");
    if (avatarBtn && avatarInput) {
      avatarBtn.addEventListener("click", function () {
        if (!store.getToken()) return;
        avatarInput.click();
      });
      avatarInput.addEventListener("change", function () {
        var file = avatarInput.files && avatarInput.files[0];
        if (file) loadAvatar(file);
        avatarInput.value = "";
      });
    }
    view.renderProfile();

    view.updateSaveUI();
    if (store.isDirty()) view.setStatus(store.getToken() ? "Несохранённые изменения" : "Несохранённые изменения — подключите GitHub");

    // adopt published data unless there are local unsaved edits; always clear the loading flash
    store.fetchPublished().then(function (p) {
      view.setLoading(false);
      if (p && !store.isDirty()) {
        store.state.cards = p.cards;
        store.state.profile = p.profile || { avatar: "" };
        store.state.tags = store.loadTags();
        markDirty(false);
        view.setStatus("");
      }
      view.render();
      view.renderProfile();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(Bench.store, Bench.render);
