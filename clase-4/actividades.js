"use strict";

// Demostraciones de las actividades de la clase 4: Stroop, n-back, clasificación de cartas y viñetas.
// La Torre de Hanoi tiene su propio script (hanoi.js).
(() => {
  const seconds = ms => (ms / 1000).toFixed(1).replace(".", ",");
  const rand = n => Math.floor(Math.random() * n);

  function element(tag, className = "", text = "") {
    const el = document.createElement(tag);
    el.className = className;
    el.textContent = text;
    return el;
  }

  function button(className, text) {
    const el = element("button", className, text);
    el.type = "button";
    return el;
  }

  // Stroop: se cronometra desde "Iniciar" hasta marcar todas las palabras, una por una.
  const stroopTimes = {};
  let cancelStroop = null;
  const stroopCompare = element("p", "stroop-compare");
  stroopCompare.setAttribute("aria-live", "polite");
  document.querySelector(".stroop-cards")?.after(stroopCompare);

  function updateStroopCompare() {
    if (stroopTimes.A === undefined || stroopTimes.C === undefined) return;
    const diff = stroopTimes.C - stroopTimes.A;
    const reading = diff > 0
      ? "Compará las condiciones: ¿qué resultó más difícil?"
      : "En esta corrida no hubo demora: vale la pena preguntar por qué.";
    const gap = seconds(Math.abs(diff));
    const sign = gap === "0,0" ? "" : diff > 0 ? "+" : "−";
    stroopCompare.textContent = `Diferencia C − A: ${sign}${gap} s. ${reading} Demo breve: incluye el manejo; no es un puntaje del test.`;
  }

  document.querySelectorAll(".stroop-card").forEach(card => {
    const title = card.querySelector("h3");
    const task = card.querySelector(".stroop-task");
    const part = title.textContent.charAt(0);
    const head = element("div", "stroop-head");
    const start = button("activity-button", "Iniciar");
    title.replaceWith(head);
    head.append(title, start);

    const words = [...card.querySelectorAll(".stroop-words li")].map(li => {
      const item = button(`stroop-item ${li.className}`, li.textContent);
      li.className = "";
      li.replaceChildren(item);
      return item;
    });

    let running = false;
    let startedAt = 0;
    let done = 0;
    const instruction = task.textContent;
    let timer;
    function cancel() {
      running = false; clearInterval(timer); start.textContent = "Iniciar";
      card.classList.remove("running"); task.textContent = instruction;
    }

    function begin() {
      cancelStroop?.();
      cancelStroop = cancel;
      delete stroopTimes[part]; stroopCompare.textContent = "";
      running = true;
      card.classList.add("running");
      done = 0;
      startedAt = performance.now();
      words.forEach(word => word.classList.remove("done"));
      start.textContent = "Terminé";
      task.textContent = instruction;
      timer = setInterval(() => { start.textContent = `Terminé · ${seconds(performance.now() - startedAt)} s`; }, 100);
    }

    function finish() {
      running = false; clearInterval(timer); card.classList.remove("running");
      const elapsed = performance.now() - startedAt;
      stroopTimes[part] = elapsed;
      start.textContent = "Repetir";
      task.textContent = `Tiempo: ${seconds(elapsed)} s.`;
      updateStroopCompare();
    }

    start.addEventListener("click", () => running ? finish() : begin());
    new MutationObserver(() => { if (card.closest(".slide").hidden && running) cancel(); }).observe(card.closest(".slide"), { attributes: true, attributeFilter: ["hidden"] });
    words.forEach(word => word.addEventListener("click", () => {
      if (!running || word.classList.contains("done")) return;
      word.classList.add("done");
      done++;
      if (done === words.length) finish();
      else task.textContent = `Marcá cada uno al decirlo. Llevás ${done} de ${words.length}.`;
    }));
  });

  // n-back: se marcan las posiciones que coinciden con la de dos lugares antes, y después se revisa.
  const sequence = document.querySelector("ol.sequence[data-letters]");
  if (sequence) {
    const pool = ["B", "C", "H", "R"];
    const answer = sequence.closest(".slide").querySelector("details.answer p");
    const wrap = element("div", "nback-top");
    const side = element("div", "nback-side");
    const status = element("p", "nback-status");
    const checkButton = button("activity-button", "Revisar");
    const freshButton = button("activity-button", "Otra secuencia");
    status.setAttribute("aria-live", "polite");
    side.append(checkButton, freshButton, status);
    sequence.replaceWith(wrap);
    wrap.append(sequence, side);

    let letters = [...sequence.dataset.letters];
    let marks = [];

    const isMatch = i => i >= 2 && letters[i] === letters[i - 2];

    function draw() {
      marks = letters.map(() => false);
      sequence.replaceChildren(...letters.map((letter, i) => {
        const cell = button("seq-cell", letter);
        cell.setAttribute("aria-pressed", "false");
        cell.setAttribute("aria-label", `Posición ${i + 1}: ${letter}`);
        cell.addEventListener("click", () => {
          marks[i] = !marks[i];
          cell.setAttribute("aria-pressed", String(marks[i]));
          cell.classList.remove("ok", "miss");
          status.textContent = "";
        });
        const li = element("li");
        li.append(element("span", "", String(i + 1)), cell);
        return li;
      }));
      status.textContent = "Marcá las posiciones que coinciden con la de dos lugares antes.";
      const matches = letters.map((_, i) => i).filter(isMatch);
      answer.textContent = matches.length
        ? matches.map(i => `Posición ${i + 1}: la ${letters[i]} coincide con la de la posición ${i - 1}.`).join(" ") + " Las demás no coinciden con la de dos lugares antes."
        : "Ninguna posición coincide con la de dos lugares antes.";
    }

    function checkMarks() {
      const cells = [...sequence.querySelectorAll(".seq-cell")];
      const messages = [];
      letters.forEach((letter, i) => {
        const truth = isMatch(i);
        cells[i].classList.toggle("ok", truth && marks[i]);
        cells[i].classList.toggle("miss", truth !== marks[i]);
        if (truth && !marks[i]) messages.push(`Falta la posición ${i + 1}: la ${letter} coincide con la de la posición ${i - 1}.`);
        if (!truth && marks[i]) {
          messages.push(i < 2
            ? `La posición ${i + 1} no tiene una letra de dos lugares antes.`
            : `La posición ${i + 1} no coincide: la ${letter} no es igual a la de la posición ${i - 1}.`);
        }
      });
      status.textContent = messages.length ? messages.join(" ") : "¡Correcto! Marcaste todas las coincidencias.";
    }

    function newSequence() {
      do {
        letters = Array.from({ length: 5 }, () => pool[rand(pool.length)]);
      } while (!letters.some((_, i) => isMatch(i)));
      draw();
    }

    checkButton.addEventListener("click", checkMarks);
    freshButton.addEventListener("click", newSequence);
    draw();
    const round = button("activity-button", "Ronda de memoria");
    side.prepend(round);
    const stage = element("div", "nback-stage");
    stage.hidden = true;
    const stimulus = element("div", "nback-stimulus");
    stimulus.setAttribute("aria-live", "polite");
    const prompt = element("p", "nback-prompt");
    const actions = element("div", "nback-actions");
    stage.append(stimulus, prompt, actions);
    wrap.before(stage);
    const explanation = sequence.closest(".slide").querySelector("details.answer");
    const question = sequence.closest(".slide").querySelector(".question");
    const slide = sequence.closest('.slide');
    const hint = element('p', 'nback-hint', 'Letra: 1,5 s · Fijación: 0,5 s. F = coincide · J = no coincide. Respondé desde la tercera letra.');
    const feedback = element('p', 'nback-response');
    feedback.setAttribute('aria-live', 'polite');
    const stop = button('activity-button', 'Volver al ejemplo');
    stage.append(feedback, hint, stop);
    let trial = [], responses = [], position = 0, timer, running = false;
    function leaveRound() {
      clearTimeout(timer); running = false;
      stage.hidden = true; wrap.hidden = false; explanation.hidden = false; question.hidden = false;
    }
    stop.onclick = () => { leaveRound(); round.focus(); };
    function respond(value) {
      if (!running || position < 2 || responses[position] !== null) return;
      responses[position] = value;
      feedback.textContent = 'Respuesta registrada';
      actions.querySelectorAll('button').forEach(b => { b.disabled = true; });
    }
    function showTrial() {
      actions.replaceChildren();
      feedback.textContent = '';
      if (position === trial.length) {
        running = false;
        const correct = responses.slice(2).filter((value, i) => value !== null && value === (trial[i + 2] === trial[i])).length;
        const missed = responses.slice(2).filter(value => value === null).length;
        stimulus.textContent = `${correct} / ${trial.length - 2}`;
        prompt.textContent = `Decisiones correctas · Sin responder: ${missed}. ¿Cómo actualizaron las dos últimas letras?`;
        const again = button("activity-button", "Otra ronda"); again.onclick = beginRound;
        actions.append(again);
        again.focus({ preventScroll: true });
      } else {
        stimulus.textContent = trial[position];
        prompt.textContent = `Letra ${position + 1} de ${trial.length}. ` + (position < 2 ? "Retenela: todavía no hay una letra dos lugares antes." : "¿Coincide con la de dos lugares antes?");
        [true, false].forEach(value => {
          const choice = button('activity-button', value ? 'F · Coincide' : 'J · No coincide');
          choice.disabled = position < 2; choice.onclick = () => respond(value); actions.append(choice);
        });
        timer = setTimeout(() => {
          stimulus.textContent = '+';
          timer = setTimeout(() => { position++; showTrial(); }, 500);
        }, 1500);
      }
    }
    function beginRound() {
      do { trial = Array.from({ length: 10 }, () => pool[rand(pool.length)]); }
      while (!trial.some((letter, i) => i >= 2 && letter === trial[i - 2]));
      clearTimeout(timer); running = true;
      position = 0; responses = trial.map(() => null); wrap.hidden = true; stage.hidden = false;
      explanation.open = false; explanation.hidden = true; question.hidden = true; showTrial();
      stage.tabIndex = -1; stage.focus({ preventScroll: true });
    }
    round.onclick = beginRound;
    document.addEventListener('keydown', event => {
      if (slide.hidden || stage.hidden || event.ctrlKey || event.altKey || event.metaKey || document.querySelector('dialog[open]') || event.target.closest('input, textarea, select, [contenteditable]')) return;
      const key = event.key.toLowerCase();
      if (key !== 'f' && key !== 'j') return;
      event.preventDefault(); event.stopImmediatePropagation();
      if (!event.repeat) respond(key === 'f');
    }, true);
    new MutationObserver(() => { if (slide.hidden && running) leaveRound(); }).observe(slide, { attributes: true, attributeFilter: ['hidden'] });
    document.addEventListener('visibilitychange', () => { if (document.hidden && running) leaveRound(); });
    new MutationObserver(() => { if (document.querySelector('dialog[open]') && running) leaveRound(); }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open'] });
  }

  // Clasificación de cartas: el criterio (forma, color o número) cambia sin aviso tras varios aciertos seguidos.
  const wcst = document.querySelector(".wcst");
  if (wcst) {
    const SHAPES = [
      { name: "triángulo", plural: "triángulos", feminine: false },
      { name: "círculo", plural: "círculos", feminine: false },
      { name: "estrella", plural: "estrellas", feminine: true },
      { name: "cuadrado", plural: "cuadrados", feminine: false }
    ];
    const COLORS = [
      { singular: "rojo", feminine: "roja", plural: "rojos", femininePlural: "rojas" },
      { singular: "verde", feminine: "verde", plural: "verdes", femininePlural: "verdes" },
      { singular: "azul", feminine: "azul", plural: "azules", femininePlural: "azules" },
      { singular: "amarillo", feminine: "amarilla", plural: "amarillos", femininePlural: "amarillas" }
    ];
    const RULES = ["forma", "color", "número"];
    const STREAK = 6;       // aciertos seguidos para cambiar el criterio; en la prueba original son 10
    const CATEGORIES = 3;
    const EXAMPLE = { shape: 0, color: 0, n: 2 };   // 2 triángulos rojos
    const keys = SHAPES.map((_, i) => ({ shape: i, color: i, n: i + 1 }));

    function label(card) {
      const shape = SHAPES[card.shape];
      const color = COLORS[card.color];
      const noun = card.n === 1 ? shape.name : shape.plural;
      const adjective = card.n === 1
        ? (shape.feminine ? color.feminine : color.singular)
        : (shape.feminine ? color.femininePlural : color.plural);
      return `${card.n} ${noun} ${adjective}`;
    }

    function matches(card, key, rule) {
      if (rule === "forma") return card.shape === key.shape;
      if (rule === "color") return card.color === key.color;
      return card.n === key.n;
    }

    function artwork(card) {
      const group = element("span", "card-art");
      group.setAttribute("aria-hidden", "true");
      for (let i = 0; i < card.n; i++) {
        const shape = element("span", `card-shape shape-${card.shape} color-${card.color}`);
        group.append(shape);
      }
      return group;
    }
    const keyBox = element("div", "wcst-keys");
    const options = element("div", "wcst-options");
    const restartButton = button("activity-button", "Reiniciar");
    keyBox.append(element("h3", "", "Cartas de referencia"), options, restartButton);
    keys.forEach((key, i) => {
      const option = button("", "");
      option.setAttribute("aria-label", label(key));
      option.append(artwork(key), element("span", "card-caption", label(key)));
      option.addEventListener("click", () => choose(i));
      options.append(option);
    });

    const cardText = element("p");
    const cardBox = element("div", "wcst-card");
    cardBox.append(element("h3", "", "Carta a clasificar"), cardText);
    const status = element("p", "wcst-status");
    const counts = element("p", "wcst-count");
    status.setAttribute("aria-live", "polite");
    const side = element("div", "wcst-side");
    side.append(cardBox, status, counts);
    wcst.replaceChildren(keyBox, side);

    const ruleNote = element("p", "wcst-rule");
    wcst.closest(".slide").querySelector("details.answer")?.append(ruleNote);

    let card = EXAMPLE;
    let ruleIndex = 0;
    let streak = 0;
    let categories = 0;
    let errors = 0;
    let perseverative = 0;
    let previousRule = null;
    let over = false;

    function draw() {
      cardText.replaceChildren(artwork(card), element("span", "card-caption", label(card)));
      options.querySelectorAll("button").forEach(b => { b.disabled = over; });
      counts.textContent = `Aciertos seguidos: ${streak} · Categorías: ${categories} de ${CATEGORIES} · Errores: ${errors}`;
      ruleNote.textContent = `Criterio vigente: ${RULES[ruleIndex]}. Cambia tras ${STREAK} aciertos seguidos (en la prueba original, 10).`;
    }

    function choose(index) {
      if (over) return;
      const rule = RULES[ruleIndex];
      if (matches(card, keys[index], rule)) {
        streak++;
        status.textContent = "Bien.";
        if (streak === STREAK) {
          categories++;
          streak = 0;
          if (categories === CATEGORIES) {
            over = true;
            status.textContent = `Fin de la ronda: ${errors} errores; ${perseverative} coincidieron con el criterio anterior.`;
          } else {
            previousRule = rule;
            ruleIndex++;
          }
        }
      } else {
        errors++;
        streak = 0;
        if (previousRule && matches(card, keys[index], previousRule)) perseverative++;
        status.textContent = "Mal.";
      }
      if (!over) card = { shape: rand(4), color: rand(4), n: rand(4) + 1 };
      draw();
    }

    function reset() {
      card = EXAMPLE;
      ruleIndex = 0;
      streak = 0;
      categories = 0;
      errors = 0;
      perseverative = 0;
      previousRule = null;
      over = false;
      status.textContent = "Elegí una carta de referencia.";
      draw();
    }

    restartButton.addEventListener("click", reset);
    reset();
  }

  // Viñetas: se elige una función y la respuesta explica por qué.
  const CHIPS = ["Monitorización", "Alternancia", "Inhibición", "Planificación"];
  const verdicts = [
    {
      correct: 0,
      messages: [
        "Correcto: no monitorea ni termina la tarea sin control externo (Tirapu y Luna-Lario, 2008, p. 223).",
        "No: no hay un criterio que mantener ni cambiar; el problema es que la tarea queda sin terminar.",
        "No: no hay una respuesta impulsiva que frenar.",
        "Puede haber una planificación débil, pero el rasgo central es no notarlo mientras trabaja."
      ]
    },
    {
      correct: 1,
      messages: [
        "Sí registra el \"mal\", pero no cambia el criterio: el fallo está en cambiarlo.",
        "Correcto: mantiene un criterio que ya no sirve (perseveración; Tirapu y Luna-Lario, 2008, p. 234).",
        "Es una discusión posible: Tirapu y Luna-Lario asocian la perseveración con fallas de inhibición (p. 234). La respuesta más directa es la alternancia.",
        "No hay un plan que armar: la consigna sigue siendo clasificar por color."
      ]
    },
    {
      correct: 2,
      messages: [
        "No: la tarea no es el problema, sino lo que se dice en la interacción.",
        "No hay un criterio que cambiar: lo que falta es la pausa antes de hablar.",
        "Correcto: dice lo primero sin anticipar consecuencias (Tirapu y Luna-Lario, 2008, p. 224). Ardila y Ostrosky-Solís (2008) lo ligarían con la coordinación de cognición y emoción.",
        "Planificar supone armar una secuencia antes de actuar; aquí la respuesta sale antes de pensarla."
      ]
    }
  ];

  document.querySelectorAll("ol.activity-questions li").forEach((li, index) => {
    const verdict = verdicts[index];
    if (!verdict) return;
    const text = element("p", "vignette-text", li.textContent);
    const chipRow = element("div", "vignette-chips");
    const note = element("p", "vignette-feedback");
    note.setAttribute("aria-live", "polite");
    CHIPS.forEach((label, choice) => {
      const chip = button("vignette-chip", label);
      chip.setAttribute("aria-pressed", "false");
      chip.addEventListener("click", () => {
        chipRow.querySelectorAll(".vignette-chip").forEach(other => other.setAttribute("aria-pressed", "false"));
        chip.setAttribute("aria-pressed", "true");
        note.textContent = verdict.messages[choice];
        note.classList.toggle("ok", choice === verdict.correct);
        note.classList.toggle("miss", choice !== verdict.correct);
      });
      chipRow.append(chip);
    });
    li.replaceChildren(text, chipRow, note);
  });

  // Casos de estrategias de solución (Postigo Angón, 2014, cap. 9): un caso por vez.
  // Se elige una estrategia y la explicación indica por qué sirve o no.
  const strategyBox = document.querySelector(".strategy-cases");
  if (strategyBox) {
    const STRATEGIES = ["Ensayo y error", "Medios-fines", "Submetas", "Hacia atrás", "Analogía"];
    const cases = [
      {
        text: "Tiene que abrir un candado de tres cifras que no conoce. Prueba una combinación, anota la que no funcionó y no la vuelve a probar.",
        correct: 0,
        messages: [
          "Correcto: prueba caminos, registra los fallidos y no los repite (Postigo Angón, 2014, p. 228).",
          "No: no compara la situación con una meta para reducir la mayor diferencia; prueba combinaciones sin ese criterio.",
          "No: no divide el problema en partes; cada prueba es sobre el candado completo.",
          "No: trabajar hacia atrás exige partir de un estado final conocido, y acá no hay uno.",
          "No: no recuerda la solución de un problema parecido; cada intento es una combinación nueva."
        ]
      },
      {
        text: "Tiene que dejar presentable su casa para una visita dentro de una hora. Compara cómo está con cómo debe estar y ve que lo que más se aleja es la cocina, llena de platos. Empieza por lavarlos.",
        correct: 1,
        messages: [
          "No: no prueba cosas al azar; compara el estado actual con la meta.",
          "Correcto: compara el estado actual con la meta, identifica la mayor diferencia y aplica la acción que la reduce (Postigo Angón, 2014, p. 231).",
          "Medios-fines también usa submetas (p. 231). Lo que la define es elegir, en cada paso, la acción que más reduce la diferencia con la meta.",
          "No: avanza desde el estado actual hacia la meta. Partir de la meta hacia atrás es otra estrategia (p. 234).",
          "No: no recuerda una situación parecida; evalúa la diferencia entre el estado actual y la meta."
        ]
      },
      {
        text: "Tiene que escribir un informe de 20 páginas. Primero arma un esquema con tres secciones y escribe cada una por separado. Después las une y revisa que todo tenga sentido.",
        correct: 2,
        messages: [
          "No: no prueba caminos al azar; planifica las partes antes de escribir.",
          "Se parece a medios-fines, que también usa submetas (p. 231). La diferencia: acá cada parte se resuelve por separado y después se unen.",
          "Correcto: divide el problema en partes y resuelve cada una como un problema más pequeño (Postigo Angón, 2014, p. 233).",
          "No: no parte de la meta hacia el inicio; avanza desde el inicio hacia el final.",
          "No: no usa como modelo la solución de un problema anterior."
        ]
      },
      {
        text: "Al final del tercer día le quedan a Lucía 40 pesos. Cada día gastó la mitad de lo que tenía al empezarlo. Para saber cuánto tenía el primer día, parte de los 40 pesos y va haciendo cuentas hacia atrás.",
        correct: 3,
        messages: [
          "No: no prueba montos al azar; calcula a partir del dato final.",
          "No: medios-fines avanza hacia la meta. Acá, en cambio, se parte de la meta y se retrocede (p. 234).",
          "No: no divide el problema en partes que se resuelven hacia adelante; la cuenta va del final al principio.",
          "Correcto: parte de la meta, que está especificada y es única, y retrocede hasta el estado inicial (Postigo Angón, 2014, p. 234).",
          "No: no recuerda un problema parecido resuelto antes."
        ]
      },
      {
        text: "Tiene que organizar el viaje de egresados. Recuerda cómo organizó el de su curso del año pasado, con el mismo orden de decisiones: transporte, alojamiento y, al final, actividades. Repite ese orden y ajusta los detalles.",
        correct: 4,
        messages: [
          "No: no prueba opciones al azar; aplica una solución que ya conoce.",
          "No: no compara el estado actual con la meta para reducir diferencias; reproduce un plan que ya funcionó.",
          "Hay un orden de decisiones, pero no divide el problema en partes que se resuelven por separado.",
          "No: no parte de la meta hacia el inicio; copia el orden de un caso anterior.",
          "Correcto: usa la solución de un problema parecido como modelo (Postigo Angón, 2014, p. 235). Ahorra esfuerzo, pero exige reconocer la semejanza."
        ]
      }
    ];

    const cards = cases.map((item, index) => {
      const card = element("div", "strategy-case");
      card.hidden = index !== 0;
      const count = element("p", "strategy-count", `Caso ${index + 1} de ${cases.length}`);
      const text = element("p", "vignette-text", item.text);
      const chipRow = element("div", "vignette-chips");
      const note = element("p", "vignette-feedback");
      note.setAttribute("aria-live", "polite");
      STRATEGIES.forEach((name, choice) => {
        const chip = button("vignette-chip", name);
        chip.setAttribute("aria-pressed", "false");
        chip.addEventListener("click", () => {
          chipRow.querySelectorAll(".vignette-chip").forEach(other => other.setAttribute("aria-pressed", "false"));
          chip.setAttribute("aria-pressed", "true");
          note.textContent = item.messages[choice];
          note.classList.toggle("ok", choice === item.correct);
          note.classList.toggle("miss", choice !== item.correct);
        });
        chipRow.append(chip);
      });
      card.append(count, text, chipRow, note);
      return card;
    });

    const previousButton = button("activity-button", "Anterior");
    const nextButton = button("activity-button", "Siguiente");
    const nav = element("div", "strategy-nav");
    nav.append(previousButton, nextButton);
    let current = 0;

    function show(index) {
      current = Math.max(0, Math.min(cards.length - 1, index));
      cards.forEach((card, i) => { card.hidden = i !== current; });
      previousButton.disabled = current === 0;
      nextButton.disabled = current === cards.length - 1;
    }

    previousButton.addEventListener("click", () => show(current - 1));
    nextButton.addEventListener("click", () => show(current + 1));

    // Para imprimir: todos los casos, con la estrategia correcta de cada uno.
    const printList = element("ol", "print-only");
    printList.append(...cases.map(item => element("li", "", `${item.text} Estrategia: ${STRATEGIES[item.correct].toLowerCase()}.`)));

    strategyBox.append(...cards, nav, printList);
    show(0);
  }
})();
