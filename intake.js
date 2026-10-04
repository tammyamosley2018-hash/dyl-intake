// DYL Health Intake: flow, scoring, and hand-off to n8n (which updates GHL).
(function () {
  var WEBHOOK = "https://deft-bison-84.nbg1-3.instapods.app/webhook/dyl-health-intake";
  var STORE = "dyl-intake-v1";
  var D = window.INTAKE, C = window.COPY;
  var SYS = {}; D.systems.forEach(function (s) { SYS[s.key] = s; });
  var SECTION_LABEL = { environmental: "Lifestyle & Exposures" };

  var state = load() || fresh();
  function fresh() { return { lead: null, answers: {}, idx: 0 }; }
  function load() { try { return JSON.parse(localStorage.getItem(STORE)); } catch (e) { return null; } }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) {} }
  function clear() { try { localStorage.removeItem(STORE); } catch (e) {} }

  var $ = function (id) { return document.getElementById(id); };
  function show(id) {
    ["s-welcome", "s-form", "s-quiz", "s-working", "s-results"].forEach(function (s) { $(s).hidden = s !== id; });
    window.scrollTo(0, 0);
  }
  $("yr").textContent = new Date().getFullYear();

  // ---------- Where they came from (pathway map, ads, GHL emails) ----------
  // Kept separately from the answers so it survives finishing the intake.
  var TRACK_KEY = "dyl-intake-track", TRACK_FIELDS = ["cid", "utm_source", "utm_medium", "utm_campaign", "utm_content", "fbclid"];
  var track = (function () {
    var saved = {}, q = new URLSearchParams(location.search), fresh = {};
    try { saved = JSON.parse(localStorage.getItem(TRACK_KEY)) || {}; } catch (e) {}
    TRACK_FIELDS.forEach(function (k) { if (q.get(k)) fresh[k] = q.get(k); });
    var merged = Object.keys(fresh).length ? fresh : saved;  // a new visit's tags win over old ones
    try { localStorage.setItem(TRACK_KEY, JSON.stringify(merged)); } catch (e) {}
    return merged;
  })();

  // Calendly link with their name/email pre-filled and the tracking tags carried through.
  // Calendly only keeps utm_* fields, so the GHL contact id rides in utm_term.
  function consultLink() {
    var lead = state.lead || {}, q = new URLSearchParams();
    var full = [lead.firstName, lead.lastName].filter(Boolean).join(" ");
    if (full) q.set("name", full);
    if (lead.email) q.set("email", lead.email);
    q.set("utm_source", track.utm_source || "intake");
    q.set("utm_medium", track.utm_medium || "results-page");
    if (track.utm_campaign) q.set("utm_campaign", track.utm_campaign);
    if (track.utm_content) q.set("utm_content", track.utm_content);
    if (track.cid) q.set("utm_term", "cid-" + track.cid);
    return C.consultUrl + "?" + q.toString();
  }

  // ---------- Which questions this person sees ----------
  function hiddenSystem() {
    var g = state.lead && state.lead.gender;
    return g === "Male" ? "female" : g === "Female" ? "male" : null;
  }
  function visible() {
    var hide = hiddenSystem();
    return D.questions.filter(function (q) {
      if (q.sys === hide) return false;
      if (q.showIf) {
        var dep = D.questions.filter(function (x) { return x.n === q.showIf.n; })[0];
        return dep && state.answers[dep.id] === q.showIf.v;
      }
      return true;
    });
  }
  function sectionsOf(list) {
    var out = [];
    list.forEach(function (q) { if (out.indexOf(q.sys) < 0) out.push(q.sys); });
    return out;
  }

  // ---------- Report link opened from the email ----------
  var reportCode = new URLSearchParams(location.search).get("report");
  if (reportCode) {
    var rep = fromReport(reportCode);
    if (rep) { renderResults(rep.r, { first: rep.first, fromLink: true }); show("s-results"); }
  }

  // ---------- Welcome ----------
  if (state.lead && Object.keys(state.answers).length) $("resume").hidden = false;
  $("start").onclick = function () { state = fresh(); save(); show("s-form"); };
  $("resume").onclick = function () { renderQuestion(); show("s-quiz"); };

  // ---------- About you ----------
  $("lead").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target, ok = true, lead = {};
    Array.prototype.forEach.call(f.elements, function (el) {
      if (!el.name) return;
      if (el.type === "checkbox") { lead[el.name] = el.checked; return; }
      lead[el.name] = el.value.trim();
      var bad = el.required && !lead[el.name];
      if (el.type === "email" && lead[el.name] && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(lead[el.name])) bad = true;
      el.style.borderColor = bad ? "#ffb4a8" : "";
      if (bad) ok = false;
    });
    $("form-error").hidden = ok;
    if (!ok) return;
    state.lead = lead; state.idx = 0; save();
    send({ event: "started", lead: lead, track: track });
    renderQuestion(); show("s-quiz");
  });

  // ---------- Questions ----------
  function renderQuestion() {
    var list = visible();
    if (state.idx >= list.length) return finish();
    var q = list[state.idx], secs = sectionsOf(list), si = secs.indexOf(q.sys);
    $("q-section").innerHTML = "Section " + (si + 1) + " of " + secs.length + " · <b>" + (SECTION_LABEL[q.sys] || SYS[q.sys].name) + "</b>";
    $("q-count").textContent = (state.idx + 1) + " / " + list.length;
    $("q-bar").style.width = Math.round(state.idx / list.length * 100) + "%";
    $("q-text").textContent = q.text;
    var box = $("q-opts"); box.innerHTML = "";
    q.opts.forEach(function (o) {
      var b = document.createElement("button");
      b.className = "opt" + (state.answers[q.id] === o.v ? " chosen" : "");
      b.textContent = o.label;
      b.onclick = function () {
        state.answers[q.id] = o.v; save();
        Array.prototype.forEach.call(box.children, function (c) { c.classList.remove("chosen"); });
        b.classList.add("chosen");
        setTimeout(function () { state.idx++; save(); renderQuestion(); }, 220);
      };
      box.appendChild(b);
    });
    $("q-back").disabled = false;
    $("q-next").disabled = !state.answers[q.id];
  }
  $("q-back").onclick = function () {
    if (state.idx === 0) { show("s-form"); return; }
    state.idx--; save(); renderQuestion();
  };
  $("q-next").onclick = function () { state.idx++; save(); renderQuestion(); };

  // ---------- Scoring ----------
  // Same scale as ScoreApp: each body system and the overall score is Low 0-10%, Medium 11-30%, High 31%+.
  function tierOf(pct) {
    var r = Math.round(pct);
    for (var i = 0; i < C.tiers.length; i++) if (r <= C.tiers[i].to) return C.tiers[i];
    return C.tiers[C.tiers.length - 1];
  }
  function percentile(q, pct) {
    var below = 0;
    for (var i = 0; i < q.length; i++) if (q[i] < pct) below++;
    return Math.min(100, below);
  }
  function score() {
    var hide = hiddenSystem(), total = 0, bySys = {}, answers = [];
    D.questions.forEach(function (q) {
      var s = bySys[q.sys] || (bySys[q.sys] = { pts: 0, max: 0 });
      s.max += q.max;
      var v = state.answers[q.id], opt = q.opts.filter(function (o) { return o.v === v; })[0];
      var p = opt ? opt.p : 0;
      s.pts += p; total += p;
      if (q.sys !== hide) answers.push({ n: q.n, system: SYS[q.sys].name, question: q.text, answer: v || (q.showIf ? "(skipped)" : ""), points: p });
    });
    var systems = D.systems.filter(function (s) { return s.key !== hide; }).map(function (s) {
      var b = bySys[s.key], pct = b.max ? Math.round(b.pts / b.max * 1000) / 10 : 0;
      return { key: s.key, name: s.name, pct: pct, percentile: pct > 0 ? percentile(s.q, pct) : 0, tier: tierOf(pct).name };
    });
    // Her top 3: the systems where she stands out most compared with past DYL clients (these get the full explanation).
    var top = systems.filter(function (s) { return s.key !== "environmental" && s.pct > 0; })
      .sort(function (a, b) { return b.percentile - a.percentile || b.pct - a.pct; }).slice(0, 3);
    var totalPct = Math.round(total / D.potential * 100);
    return { totalPct: totalPct, tier: tierOf(totalPct).name, systems: systems, top: top, answers: answers };
  }

  // ---------- Report link (first name + scores only; no answers or health details) ----------
  function reportLink(r) {
    var data = { f: (state.lead && state.lead.firstName) || "", t: r.totalPct, top: r.top.map(function (s) { return s.key; }), s: {} };
    r.systems.forEach(function (s) { data.s[s.key] = s.pct; });
    var b64 = btoa(unescape(encodeURIComponent(JSON.stringify(data)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    return location.origin + location.pathname + "?report=" + b64;
  }
  function fromReport(code) {
    try {
      var d = JSON.parse(decodeURIComponent(escape(atob(code.replace(/-/g, "+").replace(/_/g, "/")))));
      var systems = D.systems.filter(function (s) { return d.s.hasOwnProperty(s.key); }).map(function (s) {
        return { key: s.key, name: s.name, pct: d.s[s.key], tier: tierOf(d.s[s.key]).name };
      });
      return { first: d.f, r: { totalPct: d.t, tier: tierOf(d.t).name, systems: systems,
        top: systems.filter(function (s) { return d.top.indexOf(s.key) >= 0; }) } };
    } catch (e) { return null; }
  }

  // ---------- Finish ----------
  function finish() {
    show("s-working");
    var r = score();
    send({ reportLink: reportLink(r),
      event: "finished", lead: state.lead, track: track, totalPct: r.totalPct, tier: r.tier, systems: r.systems,
      top: r.top.map(function (s) { return s.name + " (" + s.pct + "%, " + s.tier + ")"; }),
      answers: r.answers
    });
    clear();
    setTimeout(function () { renderResults(r); show("s-results"); }, 1400);
  }

  function renderResults(r, opts) {
    opts = opts || {};
    var book = esc(consultLink());
    var t = tierOf(r.totalPct), topKeys = r.top.map(function (s) { return s.key; });
    var name = opts.first !== undefined ? opts.first : (state.lead && state.lead.firstName) || "";
    var sub = opts.fromLink ? C.subtitle : C.emailedSubtitle.replace("{email}", esc((state.lead && state.lead.email) || "your inbox"));
    var h = "<h1>" + C.title + (name ? ", " + esc(name) : "") + "</h1><p class='subtitle'>" + sub + "</p>";
    h += "<div class='card overall'><p class='label'>" + C.overallHeading + "</p><p class='big " + t.cls + "'>" + r.totalPct + "%</p>" +
      "<div class='gauge'><i class='" + t.cls + "' style='width:" + Math.max(3, r.totalPct) + "%'></i></div><p class='tier " + t.cls + "'>" + t.name + "</p>" +
      "<div class='legend'>" + C.tiers.map(function (x) { return "<span><i class='" + x.cls + "'></i>" + x.name + "</span>"; }).join("") + "</div></div>";
    h += "<div class='card foundation'><p>" + C.foundation + "</p></div>";
    h += "<div class='card offer'><h3>" + C.offerTitle + "</h3>";
    C.offer.forEach(function (p) { h += "<p>" + p + "</p>"; });
    h += "<a class='btn' href='" + book + "' target='_blank' rel='noopener'>" + C.consultButton + "</a></div>";
    h += "<h3 class='section'>" + C.systemsHeading + "</h3>";
    var ordered = r.systems.slice().sort(function (a, b) { return b.pct - a.pct; });
    ordered.forEach(function (s) {
      var st = tierOf(s.pct), cp = C.systems[s.key], isTop = topKeys.indexOf(s.key) >= 0;
      h += "<div class='card sys" + (isTop ? " top3" : "") + "'><div class='top'><h3>" + s.name + "</h3>" +
        "<div class='score'><span class='pct " + st.cls + "'>" + Math.round(s.pct) + "%</span><span class='chip " + st.cls + "'>" + st.name + "</span></div></div>" +
        "<div class='gauge'><i class='" + st.cls + "' style='width:" + Math.max(3, s.pct) + "%'></i></div>";
      if (isTop && cp) h += "<p class='what'>" + cp.what + "</p><p class='saying'>" + cp.saying + "</p>";
      h += "</div>";
    });
    h += "<div class='consult'><a class='btn' href='" + book + "' target='_blank' rel='noopener'>" + C.consultButton + "</a>" +
      "<button class='btn ghost' onclick='window.print()'>Save as PDF / Print</button></div>";
    $("s-results").innerHTML = h;
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; }); }

  window.__intakeTest = { score: score, reportLink: reportLink, fromReport: fromReport, setState: function (s) { state = s; } };  // used by data/test_scoring.js

  // ---------- Hand-off to n8n ----------
  function send(payload, tries) {
    tries = tries || 0;
    if (WEBHOOK.indexOf("PLACEHOLDER") >= 0) { console.log("[intake] would send", payload); return; }
    fetch(WEBHOOK, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), keepalive: true })
      .then(function (res) { if (!res.ok) throw new Error(res.status); })
      .catch(function () { if (tries < 2) setTimeout(function () { send(payload, tries + 1); }, 2000 * (tries + 1)); });
  }
})();
