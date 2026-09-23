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
  // Cutoffs calibrated on 518 past DYL intakes so a top-3 system lands ~30% Enervation, ~35% Toxemia,
  // ~22% Irritation, ~13% Inflammation (most people are in the early stages without knowing it).
  function stageOf(pctile) { return pctile < 70 ? 1 : pctile < 86 ? 2 : pctile < 95 ? 3 : 4; }
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
      var pc = pct > 0 ? percentile(s.q, pct) : 0;
      return { key: s.key, name: s.name, pct: pct, percentile: pc, stage: pct > 0 ? stageOf(pc) : 0 };
    });
    var ranked = systems.filter(function (s) { return s.key !== "environmental" && s.pct > 0; })
      .sort(function (a, b) { return b.percentile - a.percentile || b.pct - a.pct; });
    var totalPct = Math.round(total / D.potential * 100);
    return {
      totalPct: totalPct,
      tier: totalPct <= 10 ? "Low" : totalPct <= 30 ? "Medium" : "High",
      systems: systems, top: ranked.slice(0, 3), watch: ranked.slice(3, 6), answers: answers
    };
  }

  // ---------- Finish ----------
  function finish() {
    show("s-working");
    var r = score();
    send({
      event: "finished", lead: state.lead, totalPct: r.totalPct, tier: r.tier,
      systems: r.systems, top: r.top.map(function (s) { return s.name + " (" + C.stages[s.stage].name + ")"; }),
      watch: r.watch.map(function (s) { return s.name + " (" + C.stages[s.stage].name + ")"; }),
      answers: r.answers
    });
    clear();
    setTimeout(function () { renderResults(r); show("s-results"); }, 1400);
  }

  function meter(stage) {
    var h = "<div class='meter'>";
    for (var i = 1; i <= 4; i++) h += "<i class='" + (i <= stage ? "on s" + stage : "") + "'></i>";
    return h + "</div>";
  }
  function renderResults(r) {
    var name = state.lead && state.lead.firstName ? esc(state.lead.firstName) + ", your" : "Your";
    var h = "<h1>" + C.headline.replace(/^Your/, name) + "</h1><div class='intro card'>";
    C.opening.forEach(function (p) { h += "<p>" + p + "</p>"; });
    h += "</div>";
    if (r.top.length) {
      h += "<h3 class='section'>" + C.topHeading + "</h3>";
      r.top.forEach(function (s) {
        var st = C.stages[s.stage], cp = C.systems[s.key];
        h += "<div class='card sys'><div class='top'><h3>" + s.name + "</h3><span class='chip s" + s.stage + "'>" + st.name + "</span></div>" +
          meter(s.stage) + "<p class='stage-line'>" + st.line + "</p><p class='what'>" + cp.what + "</p><p class='saying'>" + cp.saying + "</p></div>";
      });
    }
    if (r.watch.length) {
      h += "<h3 class='section'>" + C.watchHeading + "</h3><div class='watch'>";
      r.watch.forEach(function (s) { h += "<div><span>" + s.name + "</span><span class='chip s" + s.stage + "'>" + C.stages[s.stage].name + "</span></div>"; });
      h += "</div>";
    }
    h += "<p class='verdict'>" + C.verdict + "</p><div class='consult card'><p>" + C.consult + "</p>" +
      "<a class='btn' href='" + C.consultUrl + "' target='_blank' rel='noopener'>" + C.consultButton + "</a></div>";
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
