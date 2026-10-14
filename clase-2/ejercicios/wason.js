"use strict";

// Diseño entre sujetos: cada persona resuelve una sola versión. Los grupos se arman por paridad del mes de
// nacimiento y un sorteo decide cuál de los dos resuelve la versión abstracta. Las fases se votan una tras otra
// y el grupo que no vota mira hacia otro lado.
const MESES = {
  impar: "enero, marzo, mayo, julio, septiembre, noviembre",
  par: "febrero, abril, junio, agosto, octubre, diciembre"
};
const esc = Ejercicio.esc;
const pct = Ejercicio.pct;
const votos = Ejercicio.votos;
const otro = grupo => (grupo === "impar" ? "par" : "impar");
const grupoDe = (t, extra) => (t.version === "abstracta" ? extra.abstracta : otro(extra.abstracta));

// Opción 2 = solución: cartas p y no-q.
const trials = [
  {
    id: "abstracta", version: "abstracta",
    consigna: "Cada carta tiene una letra de un lado y un número del otro.",
    regla: "Si una carta tiene una vocal de un lado, tiene un número par del otro.",
    cartas: ["E", "K", "4", "7"],
    options: [{ label: "Solo E" }, { label: "E y 4" }, { label: "E y 7" }, { label: "E, 4 y 7" }, { label: "Otra elección" }],
    correct: 2, fields: { version: "abstracta" }
  },
  {
    id: "tematica", version: "temática",
    consigna: "Cada tarjeta registra un viaje: destino de un lado y transporte del otro.",
    regla: "Cada vez que viajo a Manchester, viajo en tren.",
    cartas: ["Manchester", "Sheffield", "Tren", "Automóvil"], palabras: true,
    options: [{ label: "Solo Manchester" }, { label: "Manchester y Tren" }, { label: "Manchester y Automóvil" }, { label: "Manchester, Tren y Automóvil" }, { label: "Otra elección" }],
    correct: 2, fields: { version: "temática" }
  }
];

const sorteoHtml = asignado => (asignado
  ? `<div class="ex-callout">Versión abstracta: grupo <strong>${asignado.toUpperCase()}</strong> · Versión temática: grupo <strong>${otro(asignado).toUpperCase()}</strong></div>`
  : `<button type="button" class="ex-btn primary" id="ex-sortear">Sortear versiones</button>`);

Ejercicio({
  id: "wason",
  title: "Tarea de las cuatro cartas: abstracta y temática",
  backHref: "../index.html#slide-16",
  unit: "Fase",
  shuffle: false,
  trials,

  intro: ctx => `
    <h1 class="ex-heading">Cuatro cartas, una regla: dos versiones</h1>
    <p class="ex-lead">Cada persona resuelve una sola versión de la tarea, así nadie la resuelve después de haber visto la solución de la otra.</p>
    <ol class="ex-steps">
      <li>Dos grupos según el mes de nacimiento. <strong>Impar:</strong> ${MESES.impar}. <strong>Par:</strong> ${MESES.par}.</li>
      <li>Se sortea qué grupo resuelve la versión abstracta; el otro grupo resuelve la versión temática.</li>
      <li>En cada fase vota sólo el grupo que corresponde. El otro grupo mira hacia otro lado y no vota.</li>
      <li>Cada persona elige las cartas que daría vuelta para detectar una posible violación de la regla (el conjunto mínimo).</li>
    </ol>
    <div id="ex-sorteo">${sorteoHtml(ctx.state.extra.abstracta)}</div>
    <p class="ex-hint">Quien presenta: teclas 1 a 5 suman un voto a cada opción, Retroceso deshace el último voto, → avanza.</p>`,

  introBind(main, ctx) {
    main.querySelector("#ex-sortear")?.addEventListener("click", () => {
      ctx.state.extra.abstracta = Math.random() < 0.5 ? "impar" : "par";
      ctx.save();
      main.querySelector("#ex-sorteo").innerHTML = sorteoHtml(ctx.state.extra.abstracta);
      ctx.refresh();
    });
  },

  canStart: ctx => Boolean(ctx.state.extra.abstracta),

  trial: (t, ctx) => {
    const grupo = grupoDe(t, ctx.state.extra);
    return `
      <div class="ex-callout">Vota el grupo <strong>${grupo.toUpperCase()}</strong> (mes de nacimiento ${grupo}). El grupo ${otro(grupo).toUpperCase()} mira hacia otro lado.<small>${MESES[grupo]}</small></div>
      <div class="ex-argument compact"><p class="ex-aside">${esc(t.consigna)}</p><p>${esc(t.regla)}</p></div>
      <div class="ex-cards${t.palabras ? " words" : ""}" role="img" aria-label="Cartas visibles: ${esc(t.cartas.join(", "))}">${t.cartas.map(c => `<span class="ex-card">${esc(c)}</span>`).join("")}</div>
      <p class="ex-instruction">¿Cuáles darías vuelta para detectar una posible violación de la regla? Elegí el conjunto mínimo.</p>`;
  },

  results(ctx) {
    const [abstracta, tematica] = trials;
    const correcta = t => ctx.counts(t.id)[t.correct] / ctx.votes(t.id);
    const columna = t => {
      const counts = ctx.counts(t.id);
      const total = ctx.votes(t.id);
      const items = t.options.map((o, i) => `
        <li${i === t.correct ? ' class="ok"' : ""}>
          <span>${esc(o.label)}${i === t.correct ? " (solución)" : ""}</span>
          <span class="track"><i style="--p:${total ? counts[i] / total * 100 : 0}"></i></span>
          <span class="val">${counts[i]} · ${pct(counts[i], total)}</span>
        </li>`).join("");
      return `<section><h2 class="ex-sub">Versión ${t.version} · grupo ${grupoDe(t, ctx.state.extra)}</h2><ul class="ex-dist">${items}</ul><p class="ex-total">${votos(total)}</p></section>`;
    };
    const hay = ctx.votes(abstracta.id) && ctx.votes(tematica.id);
    const diferencia = hay ? Math.round((correcta(tematica) - correcta(abstracta)) * 100) : null;
    return `
      <h1 class="ex-heading">¿Qué eligió cada grupo?</h1>
      <p class="ex-headline">Elección de la solución: <strong>versión abstracta ${pct(ctx.counts(abstracta.id)[abstracta.correct], ctx.votes(abstracta.id))}</strong> · <strong>versión temática ${pct(ctx.counts(tematica.id)[tematica.correct], ctx.votes(tematica.id))}</strong>${hay ? ` (temática − abstracta: ${diferencia >= 0 ? "+" : "−"}${Math.abs(diferencia)} puntos)` : ""}.</p>
      <div class="ex-cols">${columna(abstracta)}${columna(tematica)}</div>
      <p class="ex-text">En ambas versiones, las cartas que permiten encontrar el caso «p y no q» son la solución.</p>
      <h2 class="ex-sub">Para conversar</h2>
      <ul class="ex-questions">
        <li>Las dos versiones tienen la misma relación, «si p, entonces q». ¿Qué cambió en la tarea? ¿Qué permaneció igual?</li>
        <li>Además de la solución, ¿qué elecciones aparecen en ambas versiones? ¿Buscaban confirmar la regla, emparejar los símbolos o leyeron un bicondicional?</li>
        <li>¿Qué datos ayudarían a decidir entre esas explicaciones: justificaciones, tiempos, instrucciones distintas?</li>
      </ul>`;
  },

  csvExtra: ctx => ({ grupo_version_abstracta: ctx.state.extra.abstracta }),

  caveat: "Los grupos se arman por mes de nacimiento y el sorteo asigna la versión a cada grupo, pero son pocas personas y las fases ocurren una después de la otra: es una demostración del diseño entre sujetos, no una réplica. Quiroga (2013, p. 76) señala que la elección de respuestas correctas aumenta con materiales reales; este grupo puede o no mostrar ese patrón."
});
