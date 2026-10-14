"use strict";

/* Motor común de los ejercicios grupales: el grupo vota a mano alzada y quien presenta registra el conteo.
   Cada página llama a Ejercicio({...}) con sus ensayos y su pantalla de resultados (ver sesgo-creencia.js).
   Pasos: 0 = presentación, 1..N = ensayos, N+1 = resultados. El estado se guarda en localStorage.
   Si la página define cfg.feedback(t, ctx), cada ensayo (con t.correct) puede cerrarse mostrando la respuesta
   correcta y esa explicación; la presentación trae un interruptor para apagarlo (ver ctx.feedbackOn). */

function Ejercicio(cfg) {
  const KEY = `ejercicio:${cfg.id}`;
  const SCHEMA = 1;
  const esc = Ejercicio.esc;
  const ids = cfg.trials.map(t => t.id);
  const byId = Object.fromEntries(cfg.trials.map(t => [t.id, t]));
  const lastStep = ids.length + 1;

  function shuffle(list) {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function fresh() {
    return { schema: SCHEMA, order: cfg.shuffle === false ? [...ids] : shuffle(ids), step: 0, counts: {}, extra: {}, revealed: {}, history: [] };
  }

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY));
      const valid = saved && saved.schema === SCHEMA && saved.order.length === ids.length && ids.every(id => saved.order.includes(id));
      if (!valid) return null;
      saved.revealed = saved.revealed || {};
      return saved;
    } catch { return null; }
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* sin almacenamiento el conteo vive sólo en memoria */ }
  }

  let state = load() || fresh();
  const optionsOf = t => t.options || cfg.options;
  const countsOf = t => state.counts[t.id] || (state.counts[t.id] = Array(optionsOf(t).length).fill(0));
  const votesOf = t => countsOf(t).reduce((a, b) => a + b, 0);
  const currentTrial = () => (state.step >= 1 && state.step <= ids.length ? byId[state.order[state.step - 1]] : null);
  const feedbackOn = () => Boolean(cfg.feedback) && state.extra.feedback !== false;
  const needsReveal = () => Boolean(currentTrial()) && feedbackOn() && !state.revealed[currentTrial().id];

  // Lo que reciben cfg.intro, cfg.trial, cfg.feedback y cfg.results.
  const ctx = {
    get state() { return state; },
    trials: cfg.trials,
    counts: id => countsOf(byId[id]),
    votes: id => votesOf(byId[id]),
    feedbackOn,
    save,
    refresh: () => updateNav()
  };

  const root = document.getElementById("ex-root");
  root.innerHTML = `
    <div class="ex-page">
      <header class="ex-bar">
        <a class="ex-back" href="${esc(cfg.backHref)}">← Volver a la clase</a>
        <span class="ex-name">${esc(cfg.title)}</span>
        <span class="ex-step" id="ex-step" aria-live="polite"></span>
      </header>
      <main class="ex-stage" id="ex-main"></main>
      <div class="ex-progress" aria-hidden="true"><div id="ex-progress-fill"></div></div>
      <nav class="ex-nav" aria-label="Controles del ejercicio">
        <button type="button" class="ex-btn" id="ex-prev">← Anterior</button>
        <div class="ex-tools">
          <button type="button" class="ex-btn quiet" id="ex-explain" title="Ver otra vez la respuesta y su explicación" hidden>Ver explicación</button>
          <button type="button" class="ex-btn quiet" id="ex-undo" title="Deshacer el último voto (Retroceso)">Deshacer voto</button>
          <button type="button" class="ex-btn quiet" id="ex-csv">Exportar CSV</button>
          <button type="button" class="ex-btn quiet" id="ex-reset">Reiniciar</button>
          <button type="button" class="ex-btn quiet" id="ex-full" title="Pantalla completa (F)">Pantalla completa</button>
        </div>
        <button type="button" class="ex-btn primary" id="ex-next">Siguiente →</button>
      </nav>
    </div>
    <dialog class="ex-feedback" id="ex-feedback" aria-labelledby="ex-fb-title">
      <div id="ex-fb-body"></div>
      <div class="ex-fb-actions">
        <button type="button" class="ex-btn" id="ex-fb-back">Volver al conteo</button>
        <button type="button" class="ex-btn primary" id="ex-fb-next">Siguiente →</button>
      </div>
    </dialog>`;
  const el = Object.fromEntries(["main", "step", "progress-fill", "prev", "next", "explain", "undo", "csv", "reset", "full", "feedback", "fb-body", "fb-back", "fb-next"].map(name => [name, document.getElementById(`ex-${name}`)]));

  function tallyHtml(t) {
    const counts = countsOf(t);
    const total = votesOf(t);
    const showAnswer = feedbackOn() && state.revealed[t.id];
    const cards = optionsOf(t).map((option, i) => `
      <div class="ex-opt${showAnswer && i === t.correct ? " correct" : ""}" style="--share:${total ? (counts[i] / total * 100).toFixed(1) : 0}">
        <span class="ex-opt-key" aria-hidden="true">Tecla ${i + 1}</span>
        ${showAnswer && i === t.correct ? '<span class="ex-opt-ok">✓ Correcta</span>' : ""}
        <span class="ex-opt-label">${esc(option.label)}</span>
        <output class="ex-count" aria-label="${esc(option.label)}">${counts[i]}</output>
        <span class="ex-opt-btns">
          <button type="button" class="ex-btn" data-vote="${i}" data-delta="-1" aria-label="Quitar un voto: ${esc(option.label)}">−1</button>
          <button type="button" class="ex-btn primary" data-vote="${i}" data-delta="1" aria-label="Sumar un voto: ${esc(option.label)}">+1</button>
        </span>
        <span class="ex-fill"></span>
      </div>`).join("");
    return `<div class="ex-tally${optionsOf(t).length > 3 ? " dense" : ""}" role="group" aria-label="Votos del grupo">${cards}</div><p class="ex-total">Votos registrados: <strong id="ex-total">${total}</strong></p>`;
  }

  // Actualiza el conteo sin volver a dibujar la pantalla, para no perder el foco del teclado.
  function updateTally(t) {
    const counts = countsOf(t);
    const total = votesOf(t);
    el.main.querySelectorAll(".ex-opt").forEach((card, i) => {
      card.style.setProperty("--share", total ? (counts[i] / total * 100).toFixed(1) : 0);
      card.querySelector(".ex-count").textContent = counts[i];
    });
    document.getElementById("ex-total").textContent = total;
  }

  function bump(i, delta) {
    const t = currentTrial();
    if (!t) return;
    const counts = countsOf(t);
    if (i < 0 || i >= counts.length || (delta < 0 && counts[i] === 0)) return;
    counts[i] += delta;
    if (delta > 0) state.history.push({ id: t.id, i });
    else {
      const at = state.history.findLastIndex(h => h.id === t.id && h.i === i);
      if (at >= 0) state.history.splice(at, 1);
    }
    save();
    updateTally(t);
  }

  function undo() {
    const t = currentTrial();
    if (!t) return;
    const at = state.history.findLastIndex(h => h.id === t.id);
    if (at < 0) return;
    const [{ i }] = state.history.splice(at, 1);
    countsOf(t)[i] -= 1;
    save();
    updateTally(t);
  }

  function updateNav() {
    const step = state.step;
    el.step.textContent = step === 0 ? "Presentación" : step === lastStep ? "Resultados" : `${cfg.unit || "Ensayo"} ${step} de ${ids.length}`;
    el["progress-fill"].style.width = `${step / lastStep * 100}%`;
    el.prev.disabled = step === 0;
    el.next.textContent = step === 0 ? "Comenzar →" : needsReveal() ? "Mostrar respuesta" : step === ids.length ? "Ver resultados →" : "Siguiente →";
    el.next.disabled = step === lastStep || (step === 0 && cfg.canStart && !cfg.canStart(ctx));
    el.undo.hidden = !currentTrial();
    el.explain.hidden = !(currentTrial() && feedbackOn() && state.revealed[currentTrial().id]);
    el.csv.disabled = step === 0;
    document.title = `${cfg.title} · Psicología del Pensamiento`;
  }

  function toggleHtml() {
    return `
      <label class="ex-toggle"><input type="checkbox" id="ex-feedback-toggle"${feedbackOn() ? " checked" : ""}><span>Mostrar la respuesta y su explicación después de cada ensayo</span></label>
      <p class="ex-hint">Activado, sirve para enseñar. Desactivado, los votos no se ven influidos por las explicaciones y la actividad se parece más a una medición.</p>`;
  }

  function bindToggle() {
    const box = el.main.querySelector("#ex-feedback-toggle");
    box?.addEventListener("change", () => {
      state.extra.feedback = box.checked;
      save();
      render();
      el.main.querySelector("#ex-feedback-toggle")?.focus();
    });
  }

  function noteHtml() {
    const parts = [cfg.caveat];
    if (feedbackOn() && ids.some(id => state.revealed[id])) {
      parts.push("Como se mostró la respuesta y su explicación durante la actividad, los votos posteriores pueden estar influidos por lo aprendido en los ensayos anteriores: tomá estos resultados como parte de la actividad de enseñanza, no como una medición.");
    }
    const text = parts.filter(Boolean).join(" ");
    return text ? `<p class="ex-note">${text}</p>` : "";
  }

  function render() {
    const t = currentTrial();
    if (state.step === 0) el.main.innerHTML = cfg.intro(ctx) + (cfg.feedback ? toggleHtml() : "");
    else if (t) el.main.innerHTML = cfg.trial(t, ctx) + tallyHtml(t);
    else el.main.innerHTML = cfg.results(ctx) + noteHtml();
    if (state.step === 0) {
      cfg.introBind?.(el.main, ctx);
      bindToggle();
    }
    updateNav();
    fit();
  }

  // Muestra la respuesta correcta y la explicación de la página en un panel sobre la pantalla de votación.
  function openFeedback(t) {
    const option = optionsOf(t)[t.correct];
    const hits = countsOf(t)[t.correct];
    const total = votesOf(t);
    el["fb-body"].innerHTML = `
      <p class="ex-fb-kicker">Respuesta correcta</p>
      <h2 class="ex-fb-answer" id="ex-fb-title">${esc(option.label)}</h2>
      <p class="ex-fb-group">${total ? `${hits} de ${total} ${total === 1 ? "voto fue" : "votos fueron"} para la respuesta correcta (${Ejercicio.pct(hits, total)}).` : "Todavía no hay votos registrados en este ensayo."}</p>
      ${cfg.feedback(t, ctx)}`;
    el["fb-next"].textContent = state.step === ids.length ? "Ver resultados →" : "Siguiente →";
    if (!el.feedback.open) el.feedback.showModal();
    el.feedback.scrollTop = 0;
    el["fb-next"].focus();
  }

  function reveal(t) {
    state.revealed[t.id] = true;
    save();
    render();
    openFeedback(t);
  }

  // Con la explicación activada, «Siguiente» primero muestra la respuesta y recién después avanza.
  function advance() {
    if (needsReveal()) reveal(currentTrial());
    else go(state.step + 1);
  }

  // En proyector hay que ver el conteo y los botones sin scroll: si la pantalla de votación no entra
  // en el alto de la ventana, se achica la tipografía base (todo está en rem). Los resultados sí pueden scrollear.
  function fit() {
    const root = document.documentElement;
    root.style.fontSize = "";
    if (state.step > ids.length) return;
    let size = parseFloat(getComputedStyle(root).fontSize);
    while (root.scrollHeight > innerHeight + 1 && size > 11) {
      size -= 0.5;
      root.style.fontSize = `${size}px`;
    }
  }

  function go(step) {
    state.step = Math.max(0, Math.min(lastStep, step));
    save();
    render();
    window.scrollTo(0, 0);
  }
  const canGoNext = () => !el.next.disabled;

  function exportCsv() {
    const rows = [];
    state.order.forEach((id, index) => {
      const t = byId[id];
      optionsOf(t).forEach((option, i) => {
        const row = { orden: index + 1, ensayo: id, ...(t.fields || {}), opcion: option.label, votos: countsOf(t)[i] };
        if (t.correct !== undefined) row.es_correcta = i === t.correct ? 1 : 0;
        // Cuántos ensayos con explicación vio el grupo antes de este: mide cuánto pudo influir lo aprendido.
        if (cfg.feedback) row.explicados_antes = feedbackOn() ? state.order.slice(0, index).filter(prev => state.revealed[prev]).length : 0;
        rows.push({ ...row, ...(cfg.csvExtra?.(ctx) || {}) });
      });
    });
    const cell = value => /[",\n]/.test(String(value)) ? `"${String(value).replaceAll('"', '""')}"` : String(value);
    const header = Object.keys(rows[0]);
    const csv = [header.join(","), ...rows.map(row => header.map(name => cell(row[name] ?? "")).join(","))].join("\r\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" }));
    link.download = `${cfg.id}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      el.full.textContent = "Pantalla completa: F11";
    }
  }

  el.main.addEventListener("click", event => {
    const button = event.target.closest("[data-vote]");
    if (button) bump(Number(button.dataset.vote), Number(button.dataset.delta));
  });
  el.prev.addEventListener("click", () => go(state.step - 1));
  el.next.addEventListener("click", advance);
  el.explain.addEventListener("click", () => openFeedback(currentTrial()));
  el["fb-back"].addEventListener("click", () => el.feedback.close());
  el["fb-next"].addEventListener("click", () => {
    el.feedback.close();
    go(state.step + 1);
  });
  el.undo.addEventListener("click", undo);
  el.csv.addEventListener("click", exportCsv);
  el.full.addEventListener("click", toggleFullscreen);
  el.reset.addEventListener("click", () => {
    if (!confirm("¿Borrar todos los votos y empezar de nuevo?")) return;
    state = fresh();
    save();
    render();
  });
  document.addEventListener("fullscreenchange", () => {
    el.full.textContent = document.fullscreenElement ? "Salir de pantalla completa" : "Pantalla completa";
  });
  window.addEventListener("resize", fit);

  document.addEventListener("keydown", event => {
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    const key = event.key;
    if (el.feedback.open) {
      // Escape lo cierra el propio <dialog>; Enter y Espacio activan el botón enfocado.
      if (key === "ArrowRight" || key === "PageDown") { event.preventDefault(); el["fb-next"].click(); }
      return;
    }
    if (event.target.closest("button, a, summary, input, select, textarea") && (key === " " || key === "Enter")) return;
    if (/^[1-9]$/.test(key)) { bump(Number(key) - 1, 1); return; }
    switch (key.toLowerCase()) {
      case "backspace": event.preventDefault(); undo(); break;
      case "arrowright": case "pagedown": case " ": case "enter": event.preventDefault(); if (canGoNext()) advance(); break;
      case "arrowleft": case "pageup": event.preventDefault(); go(state.step - 1); break;
      case "f": toggleFullscreen(); break;
    }
  });

  render();
}

Ejercicio.esc = text => String(text).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
Ejercicio.pct = (part, total) => (total ? `${Math.round(part / total * 100)} %` : "—");
Ejercicio.votos = n => `${n} voto${n === 1 ? "" : "s"}`;
