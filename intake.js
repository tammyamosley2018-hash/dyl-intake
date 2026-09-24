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
    send({ event: "started", lead: lead });
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

  // ---------- Finish ----------
  function finish() {
    show("s-working");
    var r = score();
    send({
      event: "finished", lead: state.lead, totalPct: r.totalPct, tier: r.tier, systems: r.systems,
      top: r.top.map(function (s) { return s.name + " (" + s.pct + "%, " + s.tier + ")"; }),
      answers: r.answers
    });
    clear();
    setTimeout(function () { renderResults(r); show("s-results"); }, 1400);
  }

  function renderResults(r) {
    var t = tierOf(r.totalPct), topKeys = r.top.map(function (s) { return s.key; });
    var first = state.lead && state.lead.firstName ? ", " + esc(state.lead.firstName) : "";
    var h = "<h1>" + C.title + first + "</h1><p class='subtitle'>" + C.subtitle + "</p>";
    h += "<div class='card overall'><p class='label'>" + C.overallHeading + "</p><p class='big " + t.cls + "'>" + r.totalPct + "%</p>" +
      "<div class='gauge'><i class='" + t.cls + "' style='width:" + Math.max(3, r.totalPct) + "%'></i></div><p class='tier " + t.cls + "'>" + t.name + "</p>" +
      "<div class='legend'>" + C.tiers.map(function (x) { return "<span><i class='" + x.cls + "'></i>" + x.name + "</span>"; }).join("") + "</div></div>";
    h += "<div class='card foundation'><p>" + C.foundation + "</p></div>";
    h += "<div class='card offer'><h3>" + C.offerTitle + "</h3>";
    C.offer.forEach(function (p) { h += "<p>" + p + "</p>"; });
    h += "<a class='btn' href='" + C.consultUrl + "' target='_blank' rel='noopener'>" + C.consultButton + "</a></div>";
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
    h += "<div class='consult'><a class='btn' href='" + C.consultUrl + "' target='_blank' rel='noopener'>" + C.consultButton + "</a></div>";
    $("s-results").innerHTML = h;
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; }); }

  window.__intakeTest = { score: score, setState: function (s) { state = s; } };  // used by data/test_scoring.js

  // ---------- Hand-off to n8n ----------
  function send(payload, tries) {
    tries = tries || 0;
    if (WEBHOOK.indexOf("PLACEHOLDER") >= 0) { console.log("[intake] would send", payload); return; }
    fetch(WEBHOOK, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), keepalive: true })
      .then(function (res) { if (!res.ok) throw new Error(res.status); })
      .catch(function () { if (tries < 2) setTimeout(function () { send(payload, tries + 1); }, 2000 * (tries + 1)); });
  }
})();
