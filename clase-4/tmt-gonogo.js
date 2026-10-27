"use strict";

(() => {
  const seconds = ms => `${(ms / 1000).toFixed(1).replace('.', ',')} s`;
  function shuffle(items) {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }
  function cancelWhenAway(slide, cancel) {
    new MutationObserver(() => { if (slide.hidden) cancel(); }).observe(slide, { attributes: true, attributeFilter: ['hidden'] });
    document.addEventListener('visibilitychange', () => { if (document.hidden) cancel(); });
    new MutationObserver(() => { if (document.querySelector('dialog[open]')) cancel(); }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open'] });
  }

  const tmt = document.querySelector('.tmt-demo');
  if (tmt) {
    const board = tmt.querySelector('.tmt-board');
    const line = board.querySelector('polyline');
    const preview = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    preview.classList.add('tmt-preview'); line.after(preview);
    const start = tmt.querySelector('.tmt-start');
    const status = tmt.querySelector('.tmt-status');
    const clock = tmt.querySelector('output');
    const errorCount = tmt.querySelector('.tmt-count span');
    const results = tmt.querySelector('.tmt-results');
    const positions = [[12,18],[38,13],[66,18],[88,12],[16,48],[42,42],[64,50],[87,43],[12,80],[38,83],[64,78],[88,83]];
    const orders = [[5,1,4,8,9,6,2,3,7,11,10,0],[6,10,7,3,2,5,9,8,4,0,1,11]];
    let part = 0, next = 0, errors = 0, active = false, began = 0, timer;
    let saved = [], path = [];
    let pointer = null, draft = [], lastPoint = null, suppressClick = false;
    function endDrawing() {
      const id = pointer; pointer = null; draft = []; lastPoint = null;
      preview.setAttribute('points', ''); board.classList.remove('drawing');
      if (id !== null && board.hasPointerCapture(id)) board.releasePointerCapture(id);
    }
    function pointAt(x, y) {
      const rect = board.querySelector('svg').getBoundingClientRect();
      return `${100 * (x - rect.left) / rect.width},${100 * (y - rect.top) / rect.height}`;
    }
    function nodeAt(x, y) {
      return [...board.querySelectorAll('.tmt-node')].find(node => {
        const rect = node.getBoundingClientRect();
        return Math.hypot(x - rect.left - rect.width / 2, y - rect.top - rect.height / 2) <= rect.width / 2;
      });
    }
    board.addEventListener('pointerdown', event => {
      if (!active || event.button !== 0 || pointer !== null) return;
      suppressClick = false;
      const node = nodeAt(event.clientX, event.clientY);
      if (!node) return;
      const index = Number(node.dataset.index);
      if (next === 0 && index === 0) choose(index, node);
      if (index !== next - 1) return; // Other nodes retain click/keyboard selection.
      event.preventDefault();
      pointer = event.pointerId; board.setPointerCapture(pointer);
      draft = [path.at(-1)]; lastPoint = { x: event.clientX, y: event.clientY };
      board.classList.add('drawing');
    });
    function trace(x, y) {
      if (pointer === null || !active) return;
      const rect = board.getBoundingClientRect();
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        endDrawing(); status.textContent = 'Retomá el trazo desde el último círculo correcto.'; return;
      }
      draft.push(pointAt(x, y));
      preview.setAttribute('points', draft.join(' '));
      const node = nodeAt(x, y);
      if (!node || Number(node.dataset.index) < next) return;
      const index = Number(node.dataset.index);
      if (index !== next) {
        choose(index, node); endDrawing();
        status.textContent = 'Círculo fuera de orden. Retomá desde el último correcto.'; return;
      }
      choose(index, node);
      if (active) { draft = [path.at(-1)]; preview.setAttribute('points', ''); }
      else endDrawing();
    }
    board.addEventListener('pointermove', event => {
      if (event.pointerId !== pointer) return;
      event.preventDefault(); suppressClick = true;
      // Sample each segment so a fast movement cannot skip a crossed circle.
      const events = event.getCoalescedEvents?.();
      for (const sample of events?.length ? events : [event]) {
        if (pointer === null) break;
        const from = lastPoint;
        const steps = Math.max(1, Math.ceil(Math.hypot(sample.clientX - from.x, sample.clientY - from.y) / 4));
        for (let i = 1; i <= steps && pointer !== null; i++) {
          trace(from.x + (sample.clientX - from.x) * i / steps, from.y + (sample.clientY - from.y) * i / steps);
        }
        if (pointer !== null) lastPoint = { x: sample.clientX, y: sample.clientY };
      }
    });
    board.addEventListener('pointerup', event => { if (event.pointerId === pointer) endDrawing(); });
    board.addEventListener('pointercancel', endDrawing);
    board.addEventListener('lostpointercapture', endDrawing);
    function clearBoard() {
      endDrawing();
      board.querySelectorAll('button').forEach(b => b.remove());
      line.setAttribute('points', '');
    }
    function cancel() {
      if (!active) return;
      active = false; clearInterval(timer); clearBoard(); start.disabled = false;
      start.textContent = `Repetir ${part ? 'B' : 'A'}`;
      status.textContent = 'Parte interrumpida. Volvé a iniciarla para registrar el tiempo.';
    }
    function choose(index, node) {
      if (!active || index < next) return;
      if (index !== next) {
        errors++; errorCount.textContent = errors;
        node.classList.add('wrong');
        status.textContent = 'Ese punto no sigue en la secuencia. Continuá desde el último correcto.';
        return;
      }
      board.querySelectorAll('.wrong').forEach(b => b.classList.remove('wrong'));
      node.classList.add('visited'); node.setAttribute('aria-pressed', 'true');
      if (pointer !== null) path.push(...draft);
      path.push(positions[orders[part][index]].join(','));
      line.setAttribute('points', path.join(' '));
      next++; status.textContent = `${next} de 12 puntos unidos.`;
      if (next !== 12) return;
      active = false; clearInterval(timer);
      const elapsed = performance.now() - began;
      clock.textContent = seconds(elapsed); saved[part] = { elapsed, errors };
      results.replaceChildren(...saved.map((r, i) => {
        const p = document.createElement('p'); p.textContent = `${i ? 'B' : 'A'}: ${seconds(r.elapsed)} · ${r.errors} errores`; return p;
      }));
      if (part === 0) {
        part = 1; start.disabled = false; start.textContent = 'Iniciar B';
        status.textContent = 'A completada. En B vas a alternar números y letras.';
      } else {
        status.textContent = '¿Qué agregó la parte B? ¿Dónde te detuviste a buscar o a pensar?';
        start.disabled = true;
      }
    }
    start.addEventListener('click', () => {
      clearInterval(timer); clearBoard(); next = 0; errors = 0; path = []; active = true;
      tmt.querySelector('.tmt-part').textContent = part ? 'Parte B · Alternancia' : 'Parte A · Números';
      tmt.querySelector('.tmt-rule').textContent = part ? '1 → A → 2 → B → … → 6 → F' : '1 → 2 → 3 → … → 12';
      errorCount.textContent = '0'; clock.textContent = '0,0 s';
      // Insert in spatial order so Tab does not reveal the solution.
      positions.forEach(([x, y], slot) => {
        const index = orders[part].indexOf(slot);
        const node = document.createElement('button'); node.type = 'button'; node.className = 'tmt-node';
        node.textContent = part ? (index % 2 ? String.fromCharCode(65 + (index - 1) / 2) : String(index / 2 + 1)) : String(index + 1);
        node.setAttribute('aria-label', `Punto ${node.textContent}`); node.setAttribute('aria-pressed', 'false');
        node.dataset.index = String(index);
        node.style.left = `${x}%`; node.style.top = `${y}%`;
        node.onclick = event => { if (event.detail === 0 || !suppressClick) choose(index, node); }; board.append(node);
      });
      began = performance.now(); start.disabled = true; status.textContent = 'Arrastrá desde 1. Si soltás, retomá desde el último círculo correcto.';
      timer = setInterval(() => { clock.textContent = seconds(performance.now() - began); }, 100);
    });
    tmt.querySelector('.tmt-reset').onclick = () => {
      active = false; clearInterval(timer); clearBoard(); part = 0; saved = [];
      results.replaceChildren(); clock.textContent = '0,0 s'; errorCount.textContent = '0';
      start.disabled = false; start.textContent = 'Iniciar A';
      tmt.querySelector('.tmt-part').textContent = 'Parte A · Números';
      tmt.querySelector('.tmt-rule').textContent = '1 → 2 → 3 → … → 12';
      status.textContent = 'Pulsá Iniciar para ver el recorrido.';
    };
    cancelWhenAway(tmt.closest('.slide'), cancel);
  }

  const gng = document.querySelector('.gng-demo');
  if (gng) {
    const slide = gng.closest('.slide');
    const stimulus = gng.querySelector('.gng-stimulus');
    const progress = gng.querySelector('.gng-progress');
    const status = gng.querySelector('.gng-status');
    const start = gng.querySelector('.gng-start');
    const reset = gng.querySelector('.gng-reset');
    const respondButton = gng.querySelector('.gng-respond');
    const results = gng.querySelector('.gng-results');
    let trials = [], index = 0, active = false, accepting = false, responded = false, timer;
    let hits = 0, omissions = 0, commissions = 0, withheld = 0;
    function display(text, label) { stimulus.textContent = text; stimulus.setAttribute('aria-label', label); }
    function cancel() {
      if (!active) return;
      active = false; accepting = false; clearTimeout(timer);
      respondButton.disabled = true; start.disabled = false; reset.disabled = true;
      display('+', 'Ronda cancelada'); status.textContent = 'Ronda cancelada. Iniciá una nueva para completar los 20 estímulos.';
      progress.textContent = '20 estímulos · 15 círculos y 5 X';
    }
    function respond() {
      if (!active || !accepting || responded) return;
      responded = true;
      status.textContent = 'Respuesta registrada';
    }
    function showTrial() {
      if (index === trials.length) {
        active = false; accepting = false; respondButton.disabled = true; start.disabled = false; reset.disabled = true;
        start.textContent = 'Otra ronda'; display('Fin', 'Ronda terminada');
        progress.textContent = '20 de 20 estímulos';
        status.textContent = '¿Costó frenar después de varios círculos seguidos?';
        results.replaceChildren(...[
          `Círculos: ${hits} respuestas de 15 · ${omissions} omisiones`,
          `X: ${commissions} respuestas indebidas de 5 · ${withheld} retenciones correctas`
        ].map(text => { const p = document.createElement('p'); p.textContent = text; return p; }));
        start.focus({ preventScroll: true }); return;
      }
      responded = false; accepting = true; status.textContent = '\u00a0';
      progress.textContent = `Estímulo ${index + 1} de 20`;
      display(trials[index] ? '●' : 'X', trials[index] ? 'Círculo' : 'X');
      timer = setTimeout(() => {
        accepting = false;
        if (trials[index]) { if (responded) hits++; else omissions++; }
        else { if (responded) commissions++; else withheld++; }
        display('+', 'Fijación');
        timer = setTimeout(() => { index++; showTrial(); }, 300);
      }, 700);
    }
    start.onclick = () => {
      clearTimeout(timer); trials = [true, true, true, ...shuffle([...Array(12).fill(true), ...Array(5).fill(false)])];
      index = 0; hits = 0; omissions = 0; commissions = 0; withheld = 0;
      active = true; accepting = false; results.replaceChildren(); start.disabled = true; reset.disabled = false;
      respondButton.disabled = false; respondButton.focus({ preventScroll: true });
      display('+', 'Fijación inicial'); progress.textContent = 'Preparados…';
      status.textContent = 'Círculo: Espacio o botón. X: no respondas.';
      timer = setTimeout(showTrial, 1000);
    };
    reset.onclick = cancel; respondButton.onclick = respond;
    // Capture Space before presentation navigation, including held-key repeats.
    document.addEventListener('keydown', event => {
      if (!active || slide.hidden || event.ctrlKey || event.altKey || event.metaKey || document.querySelector('dialog[open]') || event.target.closest('input, textarea, select, [contenteditable]')) return;
      if (event.code !== 'Space' && event.key !== ' ') return;
      event.preventDefault(); event.stopImmediatePropagation();
      if (!event.repeat) respond();
    }, true);
    cancelWhenAway(slide, cancel);
  }
})();
