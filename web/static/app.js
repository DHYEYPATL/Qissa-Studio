// Qissa Studio — Greenlight Desk Controller v3

// ─── Presets ────────────────────────────────────────────────────────────────
const PRESETS = {
  surat: {
    genre: "regional family drama",
    seed: "A night-shift cook in Surat keeps her late mother's recipe book taped under a prep table. A food-show producer wants the pour as a clip.",
    fact: "The tape under the table still smells like asafetida from last Undhiyu season."
  },
  pune: {
    genre: "regional family drama",
    seed: "An elderly radio repairman in Pune finds an unposted 1947 Partition letter soldered inside an antique valve set brought in by a corporate land buyer.",
    fact: "The solder flux smells like pine resin and the valve is a 1947 Philips Miniwatt."
  },
  kodaikanal: {
    genre: "mythic thriller",
    seed: "A night-bus driver on the Kodaikanal ghat road hears a passenger in seat 14 whisper family secrets that only his dead brother knew.",
    fact: "The ticket was punched at the Batlagundu toll booth with a brass star clipper."
  },
  whitefield: {
    genre: "campus dark romance",
    seed: "A junior audio annotator in Bangalore cleans late-night server room recordings, only to hear her own voice from a college night she cannot remember.",
    fact: "The security lanyard is frayed at the clip from a 2019 Bellandur flood."
  }
};

// ─── State ────────────────────────────────────────────────────────────────
let currentSessionId = "";
let showAllDx        = false;
let currentDiagnoses = [];
let allCatalogItems  = [];
let currentFilter    = "all";

// ─── DOM refs ────────────────────────────────────────────────────────────
const pitchDesk   = document.getElementById("pitch-desk");
const openForm    = document.getElementById("open");
const board       = document.getElementById("board");
const tickerWrap  = document.getElementById("ticker-wrap");
const ticker      = document.getElementById("ticker");
const btnRun      = document.getElementById("run");
const btnText     = document.getElementById("btn-text");
const btnSpin     = document.getElementById("btn-spin");
const runIcon     = document.getElementById("run-icon");
const directDrawer = document.getElementById("direct-drawer");
const viewHome    = document.getElementById("view-home");
const viewCatalog = document.getElementById("view-catalog");

// =========================================================================
// Enable run button as soon as both fields have content
// =========================================================================
function checkForm() {
  const seed = document.getElementById("seed-input")?.value.trim();
  const fact = document.getElementById("fact-input")?.value.trim();
  if (btnRun) btnRun.disabled = !(seed && fact);
}
document.getElementById("seed-input")?.addEventListener("input", checkForm);
document.getElementById("fact-input")?.addEventListener("input", checkForm);
// Pre-fill uses preset — fire check after preset click too

// =========================================================================
// VIEW SWITCHING
// =========================================================================
function switchView(view) {
  const navHome    = document.getElementById("nav-home");
  const navCatalog = document.getElementById("nav-catalog");

  if (view === "catalog") {
    viewHome.hidden    = true;
    viewCatalog.hidden = false;
    navHome?.classList.remove("active");
    navCatalog?.classList.add("active");
    loadCatalog();
  } else {
    viewHome.hidden    = false;
    viewCatalog.hidden = true;
    navHome?.classList.add("active");
    navCatalog?.classList.remove("active");
  }
}

document.querySelectorAll("[data-view]").forEach(btn =>
  btn.addEventListener("click", () => switchView(btn.dataset.view))
);

// =========================================================================
// CATALOG
// =========================================================================
async function loadCatalog() {
  const grid    = document.getElementById("catalog-cards-grid");
  const barsRow = document.getElementById("catalog-bars-row");
  if (!grid) return;
  if (allCatalogItems.length) { renderCatalogCards(allCatalogItems, currentFilter); return; }

  grid.innerHTML = `<div class="cat-loading"><i class="hgi-stroke hgi-loading-03 spin"></i> Loading catalog…</div>`;

  try {
    const data = await fetch("/api/catalog").then(r => r.json());
    allCatalogItems = data.catalog || [];

    if (barsRow) {
      barsRow.innerHTML = Object.entries(data.bars || {}).map(([genre, bar]) => `
        <div class="cat-bar-chip">
          <div>
            <div class="cat-bar-genre">${cap(genre)}</div>
            <div class="cat-bar-label">completion hit-bar</div>
          </div>
          <div class="cat-bar-val">${Math.round(bar.completion_bar * 100)}%</div>
        </div>
      `).join("");
    }

    renderCatalogCards(allCatalogItems, currentFilter);
  } catch (err) {
    grid.innerHTML = `<div class="cat-loading" style="color:var(--r-l);">
      <i class="hgi-stroke hgi-alert-02"></i> Failed: ${err.message}
    </div>`;
  }
}

function renderCatalogCards(items, filter) {
  const grid = document.getElementById("catalog-cards-grid");
  if (!grid) return;

  const list = filter === "all" ? items
             : filter === "hit" ? items.filter(i => i.good)
             : items.filter(i => !i.good);

  if (!list.length) {
    grid.innerHTML = `<div class="cat-loading" style="color:var(--t3);">
      <i class="hgi-stroke hgi-search-02"></i> No items match.
    </div>`;
    return;
  }

  grid.innerHTML = list.map(item => {
    const cls   = item.status === "hit" ? "hit" : item.status === "killed" ? "killed" : "stalled";
    const icon  = item.status === "hit"    ? "hgi-star-02"
                : item.status === "killed" ? "hgi-cancel-01"
                : "hgi-alert-02";
    const label = item.status === "hit" ? "HIT" : item.status === "killed" ? "KILLED" : "STALLED";
    const bad   = item.good ? "" : " bad";

    return `
      <div class="cat-card ${cls}">
        <div class="cat-card-top">
          <div>
            <div class="cat-card-title">${item.title}</div>
            <div class="cat-card-genre">${cap(item.genre)} · ${item.minutes}m</div>
          </div>
          <span class="status-badge ${cls}">
            <i class="hgi-stroke ${icon}"></i> ${label}
          </span>
        </div>

        ${item.clone_of ? `
          <div class="clone-warn">
            <i class="hgi-stroke hgi-copy-02"></i>
            Planted clone of <strong>${item.clone_of}</strong> — Originality Guard must block.
          </div>` : ""}

        <p class="cat-card-note">${item.note || "No notes."}</p>

        <div class="cat-metrics">
          <div class="cat-metric">
            <span class="cat-metric-val${bad}">${Math.round(item.completion * 100)}%</span>
            <span class="cat-metric-lbl">Completion</span>
          </div>
          <div class="cat-metric">
            <span class="cat-metric-val${bad}">${Math.round(item.next_start * 100)}%</span>
            <span class="cat-metric-lbl">Next Ep</span>
          </div>
          <div class="cat-metric">
            <span class="cat-metric-val${bad}">${Math.round((item.coin || 0) * 100)}%</span>
            <span class="cat-metric-lbl">Coin</span>
          </div>
        </div>

        <div class="cat-card-foot">
          ${item.trope ? `<span class="cat-trope"><i class="hgi-stroke hgi-tag-02"></i>${item.trope}</span>` : `<span></span>`}
          <span class="cat-mins"><i class="hgi-stroke hgi-clock-02"></i>${item.minutes}m</span>
        </div>
      </div>
    `;
  }).join("");
}

document.querySelectorAll(".cat-filter").forEach(btn =>
  btn.addEventListener("click", () => {
    document.querySelectorAll(".cat-filter").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderCatalogCards(allCatalogItems, currentFilter);
  })
);

function cap(s) { return s.replace(/\b\w/g, c => c.toUpperCase()); }

// =========================================================================
// PRESETS
// =========================================================================
document.querySelectorAll(".preset-chip").forEach(btn =>
  btn.addEventListener("click", () => {
    document.querySelectorAll(".preset-chip").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const p = PRESETS[btn.dataset.preset];
    if (p) {
      document.getElementById("genre-select").value = p.genre;
      document.getElementById("seed-input").value   = p.seed;
      document.getElementById("fact-input").value   = p.fact;
      checkForm();
    }
  })
);

// =========================================================================
// DIRECT DRAWER
// =========================================================================
document.getElementById("btn-toggle-direct")?.addEventListener("click", () => {
  directDrawer.hidden = !directDrawer.hidden;
  if (!directDrawer.hidden) document.getElementById("note")?.focus();
});
document.getElementById("btn-close-direct")?.addEventListener("click", () => {
  directDrawer.hidden = true;
});

// =========================================================================
// QUICK CHIPS
// =========================================================================
document.querySelectorAll(".dchip").forEach(chip =>
  chip.addEventListener("click", () => {
    const n = document.getElementById("note");
    if (n) { n.value = chip.dataset.note; n.focus(); }
  })
);

// =========================================================================
// TABS
// =========================================================================
document.querySelectorAll(".tab-btn").forEach(tab =>
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(`tab-${tab.dataset.tab}`)?.classList.add("active");
  })
);

// =========================================================================
// NEW STORY LOT
// =========================================================================
document.getElementById("btn-new-lot")?.addEventListener("click", () => {
  currentSessionId = "";
  localStorage.removeItem("qissa_session_id");
  const url = new URL(window.location);
  url.searchParams.delete("session");
  window.history.replaceState({}, "", url);

  board.hidden     = true;
  pitchDesk.hidden = false;
  openForm.reset();
  checkForm();
  switchView("home");
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// =========================================================================
// TOGGLE DIAGNOSES
// =========================================================================
document.getElementById("btn-toggle-all-dx")?.addEventListener("click", function () {
  showAllDx = !showAllDx;
  renderDiagnoses(currentDiagnoses);
  this.innerHTML = showAllDx
    ? `Collapse <i class="hgi-stroke hgi-arrow-up-01"></i>`
    : `Show all <i class="hgi-stroke hgi-arrow-down-01"></i>`;
});

// =========================================================================
// SUBMIT FORM
// =========================================================================
openForm.addEventListener("submit", async e => {
  e.preventDefault();
  setLoading(true);
  tickerWrap.hidden = false;
  ticker.innerHTML = `
    <li>• Trend scouting via Parallel Search API…</li>
    <li>• Showrunner generating bible + episode 1…</li>
    <li>• Pre-scoring against 7 listener twins…</li>
    <li>• Holding at Human Gate · Canary blocked.</li>
  `;

  try {
    const fd = new FormData(openForm);
    if (currentSessionId) fd.set("session_id", currentSessionId);
    const data = await fetch("/api/open", { method: "POST", body: fd }).then(r => r.json());
    paint(data);
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    ticker.innerHTML += `<li style="color:var(--r-l);">Error: ${err.message}</li>`;
  } finally {
    setLoading(false);
  }
});

// =========================================================================
// GATE ACTIONS
// =========================================================================
document.querySelectorAll("[data-act]").forEach(btn =>
  btn.addEventListener("click", async () => {
    const action = btn.dataset.act;
    const note   = document.getElementById("note")?.value || "";
    btn.disabled = true;
    try {
      const fd = new FormData();
      fd.set("action", action);
      fd.set("note", note);
      if (currentSessionId) fd.set("session_id", currentSessionId);
      const state = await fetch("/api/gate", { method: "POST", body: fd }).then(r => r.json());
      paint(state);
      if (action === "direct") {
        directDrawer.hidden = true;
        const n = document.getElementById("note");
        if (n) n.value = "";
      }
    } catch (err) {
      alert("Gate error: " + err.message);
    } finally {
      btn.disabled = false;
    }
  })
);

// =========================================================================
// COPY PACKET
// =========================================================================
document.getElementById("btn-copy-packet")?.addEventListener("click", async () => {
  if (!currentSessionId) return;
  try {
    const text  = await fetch(`/api/packet?session_id=${encodeURIComponent(currentSessionId)}`).then(r => r.text());
    await navigator.clipboard.writeText(text);
    const lbl = document.getElementById("copy-packet-label");
    lbl.textContent = "✓ Copied!";
    setTimeout(() => { lbl.textContent = "Packet"; }, 2000);
  } catch (e) {
    alert("Copy failed: " + e.message);
  }
});

// =========================================================================
// LOADING STATE
// =========================================================================
function setLoading(on) {
  btnRun.disabled = on;
  if (on) {
    btnSpin?.classList.remove("hidden");
    if (runIcon) runIcon.style.display = "none";
    btnText.textContent = "Analyzing…";
  } else {
    btnSpin?.classList.add("hidden");
    if (runIcon) runIcon.style.display = "";
    btnText.textContent = "Run Retention Diagnostics";
  }
}

// =========================================================================
// PAINT
// =========================================================================
function paint(s) {
  if (s.error) {
    tickerWrap.hidden = false;
    ticker.innerHTML += `<li style="color:var(--r-l);">${s.error}</li>`;
    return;
  }

  if (s.session_id) {
    currentSessionId = s.session_id;
    localStorage.setItem("qissa_session_id", currentSessionId);
    const url = new URL(window.location);
    url.searchParams.set("session", currentSessionId);
    window.history.replaceState({}, "", url);
  }

  pitchDesk.hidden = true;
  board.hidden     = false;

  // Title / genre / logline / owned fact
  document.getElementById("story-title").textContent   = s.title   || "Untitled Lot";
  document.getElementById("story-genre").textContent   = s.genre   || "Regional Family Drama";
  document.getElementById("story-logline").textContent = s.logline || s.seed || "";

  const factBox = document.getElementById("owned-fact-display");
  const factEl  = document.getElementById("story-fact");
  if (s.owned_fact) { factBox.hidden = false; factEl.textContent = s.owned_fact; }
  else factBox.hidden = true;

  // Status pill
  const pill  = document.getElementById("verdict-pill");
  const label = document.getElementById("verdict-label");
  const dot   = document.getElementById("verdict-dot");
  if (s.status === "graduate") {
    Object.assign(pill.style, { borderColor:"var(--e-bd)", background:"var(--e-bg)", color:"var(--e-l)" });
    Object.assign(dot.style,  { background:"var(--e)", boxShadow:"0 0 8px var(--e)" });
    label.textContent = "GRADUATED TO AUDIO";
  } else if (s.status === "archive") {
    Object.assign(pill.style, { borderColor:"rgba(100,116,139,0.3)", background:"var(--slate-bg)", color:"#cbd5e1" });
    Object.assign(dot.style,  { background:"var(--slate)", boxShadow:"none" });
    label.textContent = "ARCHIVED";
  } else {
    Object.assign(pill.style, { borderColor:"var(--a-bd)", background:"var(--a-bg)", color:"var(--a-l)" });
    Object.assign(dot.style,  { background:"var(--a)", boxShadow:"0 0 8px var(--a)" });
    label.textContent = "HOLD FOR HUMAN GATE";
  }

  // Metrics
  const twins = s.twin_scores || [];
  const avg   = twins.length ? Math.round(twins.reduce((a, t) => a + t.score, 0) / twins.length) : "--";
  document.getElementById("m-twin").textContent   = avg;
  document.getElementById("m-turn").textContent   = `${(s.episodes?.[0]?.first_turn_minute || 5)}m`;
  const canary = s.canary || {};
  document.getElementById("m-canary").textContent = canary.ran
    ? `${(canary.completion * 100).toFixed(0)}% (${canary.vs_catalog?.includes("beats") ? "Pass" : "Below"})`
    : "Blocked";
  const ledger = s.ledger || {};
  document.getElementById("m-payoff").textContent  = `${Math.round((ledger.ratio || 0.5) * 100)}%`;
  document.getElementById("m-dialect").textContent = Math.round((s.dialect_score || 0.85) * 100) >= 75 ? "High" : "Low";
  document.getElementById("m-dark").textContent    = (s.dark_pattern_risk || "Low").includes("High") ? "High" : "Low";

  // Rework
  const rb = document.getElementById("rework-brief-card");
  const rt = document.getElementById("rework-brief-text");
  if (s.rework_brief && s.status === "archive") { rb.hidden = false; rt.textContent = s.rework_brief; }
  else rb.hidden = true;

  // Diagnoses
  currentDiagnoses = s.diagnoses || [];
  renderDiagnoses(currentDiagnoses);

  // Twins
  renderRetentionCurve(twins, s.genre || "regional family drama");
  renderTwinsTable(twins);

  // Script
  const ep1 = s.episodes?.[0] || {};
  document.getElementById("ep1-title").textContent = `Episode 1: ${ep1.title || "The Turn"} (${ep1.minutes || 12} mins)`;
  document.getElementById("script-formatted").innerHTML = formatScreenplay(ep1.script || "");

  const baList = s.before_after || [];
  const lastBA = baList[baList.length - 1];
  const baBox  = document.getElementById("ba-diff");
  const dtag   = document.getElementById("diff-cycle-tag");
  if (lastBA) {
    dtag.textContent = `Cycle ${lastBA.cycle || s.cycle}`;
    baBox.innerHTML = `
      <div style="font-weight:700;color:var(--a);font-size:12px;margin-bottom:6px;">Note: "${lastBA.note}"</div>
      <pre style="background:var(--r-bg);padding:8px;border-radius:4px;font-size:11px;font-family:var(--mono);white-space:pre-wrap;margin-bottom:6px;">${lastBA.before}</pre>
      <pre style="background:var(--e-bg);padding:8px;border-radius:4px;font-size:11px;font-family:var(--mono);white-space:pre-wrap;">${lastBA.after}</pre>
    `;
  } else {
    dtag.textContent = "No Patch";
    baBox.innerHTML = `<p class="empty-hint">No rewrite yet. Use <strong>Direct</strong> to patch.</p>`;
  }

  // Production
  const paid       = ledger.paid        || [];
  const openThrs   = ledger.still_open  || (s.memory?.open_threads || []);
  document.getElementById("ledger-ratio-line").textContent =
    `Ratio: ${Math.round((ledger.ratio || 0.5) * 100)}% · ${paid.length} Paid / ${openThrs.length} Open`;

  document.getElementById("ledger-threads").innerHTML = [
    ...paid.map(p => `<div><span class="badge badge-paid">PAID</span>${p}</div>`),
    ...openThrs.map(o => `<div><span class="badge badge-open">OPEN</span>${o}</div>`)
  ].join("");

  document.getElementById("branches-list").innerHTML = (s.branch_scores || []).map(b => `
    <div class="branch-item">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
        <strong style="font-size:12.5px;">${b.title}</strong>
        <span style="font-family:var(--mono);font-weight:700;color:var(--a);font-size:12.5px;">${b.twin_mean}</span>
      </div>
      <div style="font-size:11px;color:var(--t3);">${b.note || "Scored against 7 twins."}</div>
    </div>
  `).join("");

  document.getElementById("characters-list").innerHTML = (s.characters || []).map(c => `
    <div style="display:flex;align-items:center;gap:7px;margin-bottom:5px;font-size:12.5px;">
      <i class="hgi-stroke hgi-microphone-02" style="font-size:13px;color:var(--t3);"></i>
      <strong>${c.name}</strong>
      <span style="color:var(--c);font-family:var(--mono);font-size:11px;">[${c.voice}]</span>
    </div>
  `).join("");

  const booth = s.booth || {};
  document.getElementById("booth-details").innerHTML = `
    <div style="font-size:12px;color:var(--t2);line-height:1.8;margin-top:6px;">
      <div><i class="hgi-stroke hgi-headphones" style="font-size:13px;vertical-align:middle;margin-right:5px;"></i>Fit: ${booth.session_fit || "commute"} · Night Safe: ${booth.night_safe ? "Yes" : "No"}</div>
      <div><i class="hgi-stroke hgi-volume-high" style="font-size:13px;vertical-align:middle;margin-right:5px;"></i>${booth.atmo || "Recorded dry."}</div>
    </div>
  `;
}

// =========================================================================
// RENDER HELPERS
// =========================================================================
function renderDiagnoses(dxs) {
  const el = document.getElementById("dx-list");
  if (!el) return;
  if (!dxs?.length) {
    el.innerHTML = `<li class="dx-pass"><i class="hgi-stroke hgi-checkmark-circle-02" style="font-size:14px;vertical-align:middle;margin-right:5px;"></i>No structural pacing stalls detected.</li>`;
    return;
  }
  const list = showAllDx ? dxs : dxs.slice(0, 3);
  el.innerHTML = list.map(d => `<li><strong>• ${d.issue}:</strong> ${d.edit_op}</li>`).join("");
}

function renderRetentionCurve(twins, genre) {
  const el     = document.getElementById("curve-visual-strip");
  const hitTag = document.getElementById("curve-hit-bar-tag");
  if (!el) return;

  const bars = { "regional family drama":0.59, "mythic thriller":0.58, "campus dark romance":0.67, "investigative noir":0.56 };
  const bar  = bars[genre] || 0.59;
  if (hitTag) hitTag.textContent = `Hit Bar: ${Math.round(bar * 100)}%`;

  const cps = [
    { min:1, label:"1m" }, { min:3, label:"3m" }, { min:5, label:"5m" },
    { min:7, label:"7m" }, { min:9, label:"9m" }, { min:11, label:"11m" },
    { min:12, label:"12m" }
  ];
  const total = Math.max(1, twins.length);
  el.innerHTML = cps.map(cp => {
    const n   = twins.filter(t => t.would_finish || t.drop_minute >= cp.min).length;
    const pct = Math.round((n / total) * 100);
    const col = (pct / 100) >= bar ? "var(--e)" : "var(--r)";
    return `<div class="curve-col" title="${pct}% at min ${cp.min}">
      <span class="curve-val">${pct}%</span>
      <div class="curve-bar" style="height:${pct}%;background:${col};"></div>
      <span class="curve-lbl">${cp.label}</span>
    </div>`;
  }).join("");
}

function renderTwinsTable(twins) {
  const tb = document.getElementById("twins-table-body");
  if (!tb) return;
  tb.innerHTML = twins.map(t => {
    const pass  = t.would_start_next || t.score >= 60;
    const sc    = pass ? "var(--e-l)" : "var(--r-l)";
    const coin  = t.would_spend_coin
      ? `<i class="hgi-stroke hgi-coin-02" style="font-size:13px;color:var(--a);"></i> Yes`
      : "No";
    return `<tr title="${(t.reasons||[]).join(' · ')}">
      <td><strong>${t.persona_name}</strong></td>
      <td><strong style="color:${sc};font-family:var(--mono);">${t.score}</strong></td>
      <td style="font-family:var(--mono);">${t.drop_minute}m</td>
      <td>${t.would_finish ? "Yes" : `Drops@${t.drop_minute}m`}</td>
      <td>${coin}</td>
      <td style="color:var(--t2);font-size:11.5px;">${(t.reasons||[])[0]||"–"}</td>
    </tr>`;
  }).join("");
}

function formatScreenplay(txt) {
  if (!txt) return `<p class="empty-hint">No script yet.</p>`;
  return txt.split("\n").map(line => {
    const t = line.trim();
    if (!t) return `<div style="height:6px;"></div>`;
    if (t.startsWith("SFX:")) return `<div style="margin-bottom:5px;"><span class="spk spk-sfx">SFX</span><em>${t.slice(4).trim()}</em></div>`;
    const ci = t.indexOf(":");
    if (ci > 0 && ci < 15 && !t.startsWith("http")) {
      return `<div style="margin-bottom:5px;"><span class="spk spk-char">${t.slice(0,ci).trim()}</span>${t.slice(ci+1).trim()}</div>`;
    }
    if (t.includes("(memory)") || t.includes("(private)")) return `<div style="margin-bottom:5px;color:var(--a);font-style:italic;">${t}</div>`;
    return `<div style="margin-bottom:5px;">${t}</div>`;
  }).join("");
}

// =========================================================================
// SPEECH DICTATION
// =========================================================================
const btnMic   = document.getElementById("btn-voice-dictate");
const micLabel = document.getElementById("voice-dictate-label");
if (btnMic) {
  let rec = null; let isRec = false;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  btnMic.addEventListener("click", () => {
    if (!SR) { alert("Speech recognition not supported. Use Chrome or Edge."); return; }
    const n = document.getElementById("note");
    if (isRec) { rec?.stop(); isRec = false; micLabel.textContent = "Speak"; return; }
    rec = new SR();
    rec.continuous = true; rec.interimResults = true;
    rec.onstart  = () => { isRec = true; micLabel.textContent = "Listening…"; };
    rec.onresult = e => { let t = ""; for (let i=0;i<e.results.length;i++) t+=e.results[i][0].transcript; n.value=t; };
    rec.onerror  = () => { micLabel.textContent = "Speak"; isRec = false; };
    rec.onend    = () => { micLabel.textContent = "Speak"; isRec = false; };
    rec.start();
  });
}

// =========================================================================
// SESSION RESTORE
// =========================================================================
window.addEventListener("DOMContentLoaded", () => {
  const sid = new URLSearchParams(window.location.search).get("session") || localStorage.getItem("qissa_session_id");
  if (sid) {
    fetch(`/api/session?session_id=${encodeURIComponent(sid)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && !d.error) paint(d); })
      .catch(() => {});
  }
});
