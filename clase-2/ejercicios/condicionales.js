"use strict";

// Opciones: 0 = Sí, 1 = No, 2 = No se puede determinar. «Autorizada» es la respuesta que se sigue de la información dada.
const FORMAS = [
  { id: "MP", nombre: "Modus ponens", esquema: "p → q; p", autorizada: 0, valida: true },
  { id: "MT", nombre: "Modus tollens", esquema: "p → q; ¬q", autorizada: 1, valida: true },
  { id: "AC", nombre: "Afirmación del consecuente", esquema: "p → q; q", autorizada: 2, valida: false },
  { id: "NA", nombre: "Negación del antecedente", esquema: "p → q; ¬p", autorizada: 2, valida: false }
];

// La regla cotidiana es la de las diapositivas 13–14; la arbitraria no tiene conocimiento previo asociado.
// Cada caso: [forma, información, pregunta, explicación mostrada tras votar].
const SITUACIONES = [
  ["cotidiano", "Si aprobó el curso, recibió el certificado.", [
    ["MP", "Aprobó el curso.", "¿Recibió el certificado?",
      "La regla dice que aprobar alcanza para recibir el certificado. Como aprobó, tiene que haberlo recibido."],
    ["MT", "No recibió el certificado.", "¿Aprobó el curso?",
      "Si hubiera aprobado, la regla obligaría a que tuviera el certificado. Como no lo recibió, no puede haber aprobado."],
    ["AC", "Recibió el certificado.", "¿Aprobó el curso?",
      "La regla dice qué pasa con quien aprobó, pero no dice que solo quien aprobó reciba el certificado. Con este dato caben dos situaciones que respetan la regla: aprobó y lo recibió, o no aprobó y lo recibió por otra vía. No se puede saber cuál es la real."],
    ["NA", "No aprobó el curso.", "¿Recibió el certificado?",
      "La regla solo habla de quien aprobó; de quien no aprobó no dice nada. Con este dato caben dos situaciones que respetan la regla: no aprobó y no lo recibió, o no aprobó y lo recibió por otra vía. No se puede saber cuál es la real."]
  ]],
  ["arbitrario", "Si la figura es un círculo, es roja.", [
    ["MP", "La figura es un círculo.", "¿Es roja?",
      "La regla dice que todo círculo es rojo. Esta figura es un círculo, así que es roja."],
    ["MT", "La figura no es roja.", "¿Es un círculo?",
      "Si la figura fuera un círculo, la regla obligaría a que fuera roja. Como no es roja, no puede ser un círculo."],
    ["AC", "La figura es roja.", "¿Es un círculo?",
      "La regla dice que los círculos son rojos, no que solo los círculos sean rojos. Una figura roja puede ser un círculo o tener otra forma y la regla se cumple igual. No se puede saber cuál es."],
    ["NA", "La figura no es un círculo.", "¿Es roja?",
      "La regla solo dice de qué color son los círculos; de las demás figuras no dice nada. Una figura que no es un círculo puede ser roja o no serlo. No se puede saber cuál es."]
  ]]
];

const esc = Ejercicio.esc;
const pct = Ejercicio.pct;
const votos = Ejercicio.votos;

const trials = SITUACIONES.flatMap(([contenido, regla, casos]) => casos.map(([forma, info, pregunta, porque]) => ({
  id: `${contenido}-${forma}`,
  contenido, forma, regla, info, pregunta, porque,
  fields: { forma, contenido },
  correct: FORMAS.find(f => f.id === forma).autorizada
})));

Ejercicio({
  id: "condicionales",
  title: "Inferencias con condicionales",
  backHref: "../index.html#slide-14",
  options: [{ label: "Sí" }, { label: "No" }, { label: "No se puede determinar" }],
  trials,

  intro: ctx => `
    <h1 class="ex-heading">¿Qué se puede concluir?</h1>
    <p class="ex-lead">Ocho preguntas sobre dos reglas. En cada una, el grupo vota si se puede concluir que sí, que no, o que no se puede determinar.</p>
    <ol class="ex-steps">
      <li>Se muestra una regla, una información y una pregunta, en orden aleatorio.</li>
      <li>Respondé sólo con la información dada: no agregues otros supuestos.</li>
      <li>Se vota a mano alzada y con la cabeza baja: una opción por vez.</li>
      <li>${ctx.feedbackOn() ? "Después de cada votación se muestra la respuesta correcta y por qué lo es." : "No se muestra ninguna respuesta hasta el final."}</li>
    </ol>
    <p class="ex-hint">Quien presenta: teclas 1, 2 y 3 suman un voto a cada opción, Retroceso deshace el último voto, → ${ctx.feedbackOn() ? "muestra la respuesta y, después, pasa al siguiente" : "avanza"}.</p>`,

  trial: t => `
    <p class="ex-instruction">Suponé que la regla se cumple. ¿Qué se puede concluir con la información dada?</p>
    <div class="ex-argument">
      <p><strong>Regla:</strong> ${esc(t.regla)}</p>
      <p><strong>Se sabe que:</strong> ${esc(t.info)}</p>
      <p class="ex-conclusion">${esc(t.pregunta)}</p>
    </div>`,

  feedback: t => {
    const forma = FORMAS.find(f => f.id === t.forma);
    return `
      <h3 class="ex-fb-sub">¿Por qué?</h3>
      <p>${esc(t.porque)}</p>
      <h3 class="ex-fb-sub">Forma de la inferencia</h3>
      <p><strong>${forma.nombre}</strong> (${esc(forma.esquema)}). ${forma.valida
        ? "Es una inferencia válida: si las premisas son verdaderas, la conclusión no puede ser falsa."
        : "No es una inferencia válida: hay situaciones con premisas verdaderas en las que la conclusión sería falsa."}</p>
      <h3 class="ex-fb-sub">Cómo decidirlo</h3>
      <p>Buscá una situación en la que la regla se cumple y el dato es cierto, pero la respuesta sería otra. Si existe, no se puede determinar. Si no existe, la respuesta se sigue de la información dada.</p>`;
  },

  results(ctx) {
    const contenidos = SITUACIONES.map(s => s[0]);
    const porForma = FORMAS.map(f => {
      const counts = [0, 0, 0];
      ctx.trials.filter(t => t.forma === f.id).forEach(t => ctx.counts(t.id).forEach((n, i) => { counts[i] += n; }));
      return { f, counts, total: counts.reduce((a, b) => a + b, 0) };
    });
    const filas = porForma.map(({ f, counts, total }) => `
      <tr>
        <th scope="row">${f.nombre}<small>${f.esquema}</small></th>
        ${counts.map((n, i) => `<td class="num${i === f.autorizada ? " ok" : ""}">${n}</td>`).join("")}
        <td class="num">${pct(counts[f.autorizada], total)}</td>
      </tr>`).join("");
    const filasContenido = FORMAS.map(f => `
      <tr>
        <th scope="row">${f.nombre}</th>
        ${contenidos.map(c => {
          const t = ctx.trials.find(x => x.forma === f.id && x.contenido === c);
          return `<td class="num">${pct(ctx.counts(t.id)[f.autorizada], ctx.votes(t.id))}<small>${votos(ctx.votes(t.id))}</small></td>`;
        }).join("")}
      </tr>`).join("");
    return `
      <h1 class="ex-heading">¿Qué respondió el grupo?</h1>
      <p class="ex-lead">Votos por forma de inferencia (suma de las dos reglas). Está marcada la respuesta que se sigue de la información dada.</p>
      <table class="ex-table">
        <thead><tr><th scope="col">Forma de inferencia</th><th scope="col">Sí</th><th scope="col">No</th><th scope="col">No se puede determinar</th><th scope="col">Respuesta autorizada</th></tr></thead>
        <tbody>${filas}</tbody>
      </table>
      <h2 class="ex-sub">Respuestas autorizadas según el contenido de la regla</h2>
      <table class="ex-table">
        <thead><tr><th scope="col">Forma de inferencia</th><th scope="col">Regla cotidiana (certificado)</th><th scope="col">Regla arbitraria (figuras)</th></tr></thead>
        <tbody>${filasContenido}</tbody>
      </table>
      <h2 class="ex-sub">Para conversar</h2>
      <ul class="ex-questions">
        <li>¿Qué formas recibieron más respuestas autorizadas y cuáles menos?</li>
        <li>En afirmación del consecuente y negación del antecedente, ¿qué supuesto agregó quien respondió «Sí» o «No»? ¿De dónde salió?</li>
        <li>¿Hubo diferencias entre la regla del certificado y la de las figuras? ¿Qué podría explicarlas?</li>
        <li>Una respuesta autorizada, ¿alcanza para saber qué proceso la produjo?</li>
      </ul>`;
  },

  caveat: "Demostración con un solo grupo: pocas observaciones por celda y sin comparación controlada entre contenidos. Sirve para discutir las formas de inferencia, no para estimar porcentajes de acierto. «Autorizada» significa que la respuesta se sigue de la información dada, sin agregar supuestos."
});
