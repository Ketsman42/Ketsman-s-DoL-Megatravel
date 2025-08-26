// ==UserScript==
// @name         Ketsman's DoL Megatravel
// @namespace    http://tampermonkey.net/
// @version      2376
// @description  Adds unlimited movement option and a Megatravel menu to jump instantly to any passage. Test Build 2376.
// @author       Ketsman
// @match        *://*/*Degrees*of*Lewdity*0.5.4.9*.html*
// @match        *://*/*Degrees*of*Lewdity*.html*
// @match        file:///*Degrees*of*Lewdity*0.5.4.9*.html*
// @match        file:///*Degrees*of*Lewdity*.html*
// @run-at       document-idle
// @grant        none
// @noframes
// ==/UserScript==

(function () {
  "use strict";

  const STORAGE_KEY = "dol.megatravel.enabled";
  const FAVS_KEY = "dol.megatravel.favs";
  const RECENT_KEY = "dol.megatravel.recents";
  const ITEMS_PER_PAGE = 200;
  let currentPage = 1;
  let allFilteredItems = [];

  function getEnabled() {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === null) return true;
      return v === "1";
    } catch { return true; }
  }
  function setEnabled(v) {
    try { localStorage.setItem(STORAGE_KEY, v ? "1" : "0"); } catch {}
    updateMegatravelVisibility();
  }

  function whenSugarCubeReady(cb) {
    const i = setInterval(() => {
      const SC = getSC();
      if (SC && SC.Engine && SC.Story) {
        clearInterval(i);
        cb();
      }
    }, 250);
    setTimeout(() => clearInterval(i), 180000);
  }

  function getSC() {
    try {
      return (
        window.SugarCube ||
        (typeof unsafeWindow !== "undefined" ? unsafeWindow.SugarCube : null) ||
        (window.parent && window.parent.SugarCube) ||
        (document.defaultView && document.defaultView.SugarCube)
      );
    } catch { return null; }
  }

  function createStyle() {
    const css = document.createElement("style");
    css.textContent = `
      #megatravel-btn { display:none; margin-top:8px; }
      #megatravel-fab { position:fixed; right:18px; bottom:18px; z-index:99998; display:none; }
      #megatravel-fab button { width:46px; height:46px; border-radius:50%; border:1px solid #1f3a1f; background:linear-gradient(180deg, #7bff5f, #39ff14); color:#032003; box-shadow:0 6px 16px rgba(57,255,20,.35); font-weight:800; }
      #megatravel-modal { position:fixed; inset:0; display:none; z-index:99999; }
      #megatravel-modal .mt-backdrop { position:absolute; inset:0; background:rgba(0,0,0,.6); }
      #megatravel-modal .mt-dialog { position:relative; width:min(900px, 90vw); max-height:80vh; margin:5vh auto; background:#142614; color:#eaffea; border:1px solid #1f3a1f; border-radius:8px; box-shadow:0 10px 30px rgba(57,255,20,.25); display:flex; flex-direction:column; }
      #megatravel-modal header { padding:10px 14px; border-bottom:1px solid #1f3a1f; font-weight:700; display:flex; justify-content:space-between; align-items:center; }
      #megatravel-modal header .close { cursor:pointer; border:0; background:transparent; color:#7bff5f; font-size:18px; }
      #megatravel-modal .mt-controls { padding:10px 14px; display:flex; gap:8px; align-items:center; border-bottom:1px solid #1f3a1f; flex-wrap:wrap; }
      #megatravel-modal .mt-controls input { flex:1 1 280px; padding:6px 10px; background:#0e1a0e; color:#eaffea; border:1px solid #1f3a1f; border-radius:6px; }
      #megatravel-modal .mt-controls select, #megatravel-modal .mt-controls label { background:#0e1a0e; color:#eaffea; border:1px solid #1f3a1f; border-radius:6px; padding:6px 10px; }
      #megatravel-modal .mt-controls label { display:flex; align-items:center; gap:6px; }
      #megatravel-modal .mt-body { padding:0; overflow:auto; }
      #megatravel-modal .mt-list { list-style:none; margin:0; padding:0; }
      #megatravel-modal .mt-list li { padding:8px 14px; border-bottom:1px solid #1f3a1f; display:flex; gap:10px; justify-content:space-between; align-items:center; }
      #megatravel-modal .mt-list li button { background:linear-gradient(180deg, #7bff5f, #39ff14); color:#032003; border:1px solid #1f3a1f; border-radius:6px; padding:4px 10px; }
      #megatravel-modal .mt-list li .meta { opacity:.85; font-size:.9em; }
      #megatravel-modal .star { cursor:pointer; border:0; background:transparent; color:#7bff5f; font-size:18px; }
      #megatravel-modal .star.active { color:#39ff14; text-shadow:0 0 8px rgba(57,255,20,.45); }
      #megatravel-modal .mt-count { margin-left:auto; opacity:.8; }
      #megatravel-modal .mt-empty { padding:16px; opacity:.8; }
      #megatravel-modal .mt-loading { padding:16px; text-align:center; opacity:.8; display:none; }
      .mt-toggle { display:flex; align-items:center; gap:8px; }
      .mt-toggle input { transform: scale(1.2); }
    `;
    document.head.appendChild(css);
  }

  function ensureMegatravelButton() {
    if (!document.getElementById("megatravel-btn")) {
      const btn = document.createElement("button");
      btn.id = "megatravel-btn";
      btn.textContent = "Megatravel";
      btn.addEventListener("click", openMegatravelModal);

      const sidebarBody = document.querySelector("#ui-bar .ui-bar-body") || document.getElementById("ui-bar");
      if (sidebarBody) {
        sidebarBody.appendChild(btn);
      } else {
        document.body.appendChild(btn);
      }
    }

    updateMegatravelVisibility();

    if (!document.getElementById("megatravel-fab")) {
      const fab = document.createElement("div");
      fab.id = "megatravel-fab";
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = "M";
      b.title = "Megatravel (Ctrl+Shift+M)";
      b.addEventListener("click", openMegatravelModal);
      fab.appendChild(b);
      document.body.appendChild(fab);
    }
  }

  function updateMegatravelVisibility() {
    const btn = document.getElementById("megatravel-btn");
    if (btn) btn.style.display = getEnabled() ? "block" : "none";
    const fab = document.getElementById("megatravel-fab");
    if (fab) fab.style.display = getEnabled() ? "block" : "none";
  }

  function openMegatravelModal() {
    const modal = document.getElementById("megatravel-modal") || buildMegatravelModal();
    currentPage = 1;
    rebuildPassageList(modal);
    modal.style.display = "block";
  }

  function buildMegatravelModal() {
    const wrap = document.createElement("div");
    wrap.id = "megatravel-modal";
    wrap.innerHTML = `
      <div class="mt-backdrop"></div>
      <div class="mt-dialog">
        <header>
          <div>Instant Teleport <span class="badge">Test Build 2376</span></div>
          <button class="close" title="Close">✕</button>
        </header>
        <div class="mt-controls">
          <input id="mt-search" type="text" placeholder="Search location/passage by name..." />
          <select id="mt-category">
            <option value="all">All</option>
            <option value="favs">Favorites</option>
            <option value="recent">Recent</option>
            <option disabled>────────</option>
          </select>
          <label title="Hide system/utility passages">
            <input id="mt-onlylocations" type="checkbox" checked /> Only locations
          </label>
          <span class="mt-count" id="mt-count"></span>
        </div>
        <div class="mt-body">
          <ul class="mt-list" id="mt-list"></ul>
          <div class="mt-loading" id="mt-loading">Loading more locations...</div>
        </div>
      </div>`;
    document.body.appendChild(wrap);

    wrap.querySelector(".mt-backdrop").addEventListener("click", () => wrap.style.display = "none");
    wrap.querySelector("button.close").addEventListener("click", () => wrap.style.display = "none");
    wrap.querySelector("#mt-search").addEventListener("input", () => {
      currentPage = 1;
      rebuildPassageList(wrap);
    });
    wrap.querySelector("#mt-category").addEventListener("change", () => {
      currentPage = 1;
      rebuildPassageList(wrap);
    });
    wrap.querySelector("#mt-onlylocations").addEventListener("change", () => {
      currentPage = 1;
      rebuildPassageList(wrap);
    });

    const listEl = wrap.querySelector("#mt-list");
    listEl.addEventListener("click", (ev) => {
      const btn = ev.target.closest("button[data-passage]");
      if (!btn) return;
      const name = btn.getAttribute("data-passage");
      if (!name) return;
      recordRecent(name);
      safePlayPassage(name);
    });

    listEl.addEventListener("click", (ev) => {
      const star = ev.target.closest("button.star[data-passage]");
      if (!star) return;
      const name = star.getAttribute("data-passage");
      toggleFav(name);
      star.classList.toggle("active", isFav(name));
    });

    const mtBody = wrap.querySelector(".mt-body");
    mtBody.addEventListener("scroll", () => {
      const loadingEl = wrap.querySelector("#mt-loading");
      if (mtBody.scrollTop + mtBody.clientHeight >= mtBody.scrollHeight - 100) {
        loadMorePassages(wrap);
      }
    });

    return wrap;
  }

  function getAllPassages() {
    const SC = getSC();
    let res = [];
    if (SC && SC.Story && Array.isArray(SC.Story.passages) && SC.Story.passages.length) {
      res = SC.Story.passages
        .map(p => ({ name: p.title || p.name || "", tags: p.tags || [] }))
        .filter(p => p.name);
    }
    if (!res.length) {
      const nodes = document.querySelectorAll("tw-passagedata[name]");
      if (nodes && nodes.length) {
        res = Array.from(nodes).map(el => ({
          name: el.getAttribute("name") || "",
          tags: (el.getAttribute("tags") || "").split(/\s+/).filter(Boolean)
        })).filter(p => p.name);
      }
    }
    if (!res.length && window.Story && Array.isArray(window.Story.passages)) {
      res = window.Story.passages
        .map(p => ({ name: p.title || p.name || "", tags: p.tags || [] }))
        .filter(p => p.name);
    }
    return res;
  }

  const CATEGORY_RULES = [
    ["Town", [/town|square|market|plaza|commercial|residential|oxford|nightingale|mer|harvest|industrial|park|high|cliff|wolf|elk/i]],
    ["School", [/school|class|hall|gym|library|english|science|math/i]],
    ["Forest", [/forest|woods|clearing|wolf cave|wolf/i]],
    ["Lake/River", [/lake|river|beach|cove|sea|dock|boat|coast|harbour|harbor|mermaid/i]],
    ["Farm", [/farm|barn|field|pasture|cow|milk/i]],
    ["Temple", [/temple|church|cathedral|chapel/i]],
    ["Prison", [/prison|cell|yard|canteen|spire|laundry|medical/i]],
    ["Dungeons", [/cave|sewer|tunnel|underground|mine|crypt|basement/i]],
    ["Home/Orphanage", [/home|apartment|flat|room|orphanage|bailey|leighton/i]],
    ["Work/Shops", [/shop|store|market|supermarket|cafe|coffee|clothes|stripclub|brothel|spa|bank|factory/i]],
    ["Events/Scenes", [/event|scene|dream|nightmare|encounter|fight|combat|mission/i]],
  ];

  function categorisePassage(name, tags) {
    const tagStr = (tags || []).join(" ").toLowerCase();
    for (const [cat, regs] of CATEGORY_RULES) {
      if (regs.some(r => r.test(name) || r.test(tagStr))) return cat;
    }
    return "Other";
  }

  function getFavs() {
    try { return JSON.parse(localStorage.getItem(FAVS_KEY) || "[]"); } catch { return []; }
  }
  function isFav(name) { return getFavs().includes(name); }
  function toggleFav(name) {
    const favs = new Set(getFavs());
    if (favs.has(name)) favs.delete(name); else favs.add(name);
    try { localStorage.setItem(FAVS_KEY, JSON.stringify(Array.from(favs))); } catch {}
  }
  function recordRecent(name) {
    try {
      const arr = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      const list = [name, ...arr.filter(n => n !== name)].slice(0, 20);
      localStorage.setItem(RECENT_KEY, JSON.stringify(list));
    } catch {}
  }
  function getRecents() {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; }
  }

  function filterPassages() {
    const input = document.querySelector("#mt-search");
    const q = (input?.value || "").toLowerCase();
    const catSel = document.querySelector("#mt-category");
    const onlyLoc = document.querySelector("#mt-onlylocations")?.checked || false;
    
    let items = getAllPassages();
    items = items.map(p => ({ ...p, category: categorisePassage(p.name, p.tags) }));

    const preferredTags = new Set(["map", "location", "area", "place", "room"]);
    items = items.sort((a, b) => {
      const ap = a.tags && a.tags.some(t => preferredTags.has(String(t).toLowerCase())) ? 1 : 0;
      const bp = b.tags && b.tags.some(t => preferredTags.has(String(t).toLowerCase())) ? 1 : 0;
      if (ap !== bp) return bp - ap;
      return a.name.localeCompare(b.name);
    });
    
    if (q) items = items.filter(p => p.name.toLowerCase().includes(q));

    const selVal = catSel?.value || "all";
    if (selVal === "favs") {
      const favset = new Set(getFavs());
      items = items.filter(p => favset.has(p.name));
    } else if (selVal === "recent") {
      const rec = getRecents();
      const map = new Map(items.map(i => [i.name, i]));
      items = rec.map(n => map.get(n)).filter(Boolean);
    } else if (selVal.startsWith("cat:")) {
      const cname = selVal.slice(4);
      items = items.filter(p => p.category === cname);
    }

    if (onlyLoc) {
      const sysRx = /^(Start|StoryCaption|StoryMenu|UI|Options|Save|Load|Settings|Debug|Cheat|Credits|Config)/i;
      items = items.filter(p => !sysRx.test(p.name));
    }

    return items;
  }

  function rebuildPassageList(modal) {
    allFilteredItems = filterPassages();
    currentPage = 1;
    
    const ul = modal.querySelector("#mt-list");
    ul.innerHTML = '';
    
    const countEl = modal.querySelector("#mt-count");
    if (countEl) countEl.textContent = `Found: ${allFilteredItems.length}`;
    
    if (!allFilteredItems.length) {
      const empty = document.createElement("div");
      empty.className = "mt-empty";
      empty.textContent = "Nothing found";
      ul.appendChild(empty);
      return;
    }
    
    renderPassagesPage(modal);
  }

  function renderPassagesPage(modal) {
    const ul = modal.querySelector("#mt-list");
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, allFilteredItems.length);
    
    const fragment = document.createDocumentFragment();
    
    for (let i = startIndex; i < endIndex; i++) {
      const p = allFilteredItems[i];
      const li = document.createElement("li");
      const span = document.createElement("span");
      span.innerHTML = `<strong>${p.name}</strong> <span class="meta">(${p.category}${p.tags?.length ? ", "+p.tags.join(" ") : ""})</span>`;
      const go = document.createElement("button");
      go.type = "button";
      go.textContent = "TP";
      go.setAttribute("data-passage", p.name);
      const fav = document.createElement("button");
      fav.type = "button";
      fav.className = "star" + (isFav(p.name) ? " active" : "");
      fav.setAttribute("data-passage", p.name);
      fav.textContent = "★PIN";
      li.appendChild(span);
      li.appendChild(go);
      li.appendChild(fav);
      fragment.appendChild(li);
    }
    
    ul.appendChild(fragment);
    
    const loadingEl = modal.querySelector("#mt-loading");
    if (loadingEl) {
      loadingEl.style.display = endIndex >= allFilteredItems.length ? "none" : "block";
    }
  }

  function loadMorePassages(modal) {
    const totalPages = Math.ceil(allFilteredItems.length / ITEMS_PER_PAGE);
    if (currentPage >= totalPages) return;
    
    currentPage++;
    renderPassagesPage(modal);
  }

  function safePlayPassage(passageName) {
    try {
      const SC = getSC();
      const engine = (SC && SC.Engine) || window.Engine || null;
      if (engine && typeof engine.play === "function") {
        engine.play(passageName);
        return;
      }
      if (typeof passageName === "string" && passageName) {
        const a = document.createElement("a");
        a.setAttribute("data-passage", passageName);
        a.className = "link-internal passage-link";
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        setTimeout(() => a.remove(), 0);
        return;
      }
      if (typeof passageName === "string" && passageName) {
        location.hash = "#" + encodeURIComponent(passageName);
      }
    } catch (e) {
      console.error("Megatravel play error", e);
    }
  }

  function injectToggleIntoSettings() {
    const container = document.getElementById("passages");
    if (!container) return;
    if (container.querySelector(".mt-toggle[data-kind='megamove']")) return;
    const sectionMatchers = [
      "legend", "h1", "h2", "h3", "h4", "h5", "h6", "section", "fieldset", "div"
    ];
    const mapRegex = /(map|map settings)/i;

    let parentSection = null;
    for (const sel of sectionMatchers) {
      const els = container.querySelectorAll(sel);
      for (const el of els) {
        const txt = (el.textContent || "").trim();
        if (mapRegex.test(txt)) { parentSection = el; break; }
      }
      if (parentSection) break;
    }
    if (!parentSection) parentSection = container;

    const wrap = document.createElement("div");
    wrap.className = "mt-toggle";
    wrap.dataset.kind = "megamove";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = getEnabled();
    cb.addEventListener("change", () => setEnabled(cb.checked));
    const label = document.createElement("label");
    label.textContent = "Enable unlimited movement (Megatravel button)";
    wrap.appendChild(cb);
    wrap.appendChild(label);
    if (/^(legend|h\d)$/i.test(parentSection.tagName)) {
      parentSection.parentElement?.appendChild(wrap);
    } else {
      parentSection.appendChild(wrap);
    }
  }

  function hookPassageRender() {
    document.addEventListener(":passagerender", () => {
      try {
        injectToggleIntoSettings();
        ensureMegatravelButton();
      } catch {}
    });
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "M" || e.key === "ь" || e.keyCode === 77 || e.keyCode === 219)) {
        e.preventDefault();
        openMegatravelModal();
      }
    });
  }

  whenSugarCubeReady(() => {
    try {
      createStyle();
      const uiWait = setInterval(() => {
        const ui = document.getElementById("ui-bar");
        if (ui) {
          clearInterval(uiWait);
          ensureMegatravelButton();
        } else {
          ensureMegatravelButton();
        }
      }, 500);
      setTimeout(() => clearInterval(uiWait), 20000);
      hookPassageRender();
      updateMegatravelVisibility();
    } catch (e) {
      console.error("[Megatravel] init error", e);
    }
  });
})();
