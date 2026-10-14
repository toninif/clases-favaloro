"use strict";

// Argumentos de elaboración didáctica (no provienen de estudios publicados). Comparten la estructura de premisas
// «Ningún A es B; algunos C son B» y sólo cambian el contenido y el sentido de la conclusión:
//   válido: «algunos C no son A»        inválido: «algunos A no son C»
// Un argumento válido con conclusión no creíble exige una premisa falsa: por eso se pide suponerlas verdaderas.
// `porque` es el texto de la explicación que se muestra tras votar.
const ARGUMENTOS = [
  { id: "VC1", validez: "válido", credibilidad: "creíble", p1: "Ningún reptil es de sangre caliente.", p2: "Algunos animales domésticos son de sangre caliente.", c: "algunos animales domésticos no son reptiles",
    porque: "Los animales domésticos de sangre caliente no pueden ser reptiles, porque ningún reptil es de sangre caliente. Por lo tanto, al menos algunos animales domésticos no son reptiles: la conclusión se sigue de las premisas." },
  { id: "VC2", validez: "válido", credibilidad: "creíble", p1: "Ningún pez es mamífero.", p2: "Algunos animales marinos son mamíferos.", c: "algunos animales marinos no son peces",
    porque: "Los animales marinos que son mamíferos no pueden ser peces, porque ningún pez es mamífero. Por lo tanto, al menos algunos animales marinos no son peces: la conclusión se sigue de las premisas." },
  { id: "VN1", validez: "válido", credibilidad: "no creíble", p1: "Ninguna ave construye nidos.", p2: "Algunos gorriones construyen nidos.", c: "algunos gorriones no son aves",
    porque: "Los gorriones que construyen nidos no pueden ser aves, porque la primera premisa dice que ninguna ave construye nidos. Esa premisa es falsa en el mundo real y por eso la conclusión suena absurda. Pero lo que se juzga no es si la conclusión es verdadera: si las premisas fueran verdaderas, la conclusión tendría que serlo. Se sigue." },
  { id: "VN2", validez: "válido", credibilidad: "no creíble", p1: "Ninguna fruta crece en árboles.", p2: "Algunas manzanas crecen en árboles.", c: "algunas manzanas no son frutas",
    porque: "Las manzanas que crecen en árboles no pueden ser frutas, porque la primera premisa dice que ninguna fruta crece en árboles. Esa premisa es falsa en el mundo real y por eso la conclusión suena absurda. Pero lo que se juzga no es si la conclusión es verdadera: si las premisas fueran verdaderas, la conclusión tendría que serlo. Se sigue." },
  { id: "IC1", validez: "inválido", credibilidad: "creíble", p1: "Ninguna serpiente es un arácnido.", p2: "Algunos animales venenosos son arácnidos.", c: "algunas serpientes no son animales venenosos",
    porque: "Las premisas hablan de arácnidos y de animales venenosos, pero no dicen nada sobre si las serpientes son venenosas. Todas las serpientes podrían ser venenosas y las dos premisas seguirían siendo verdaderas (los arácnidos venenosos serían otros animales). Que la conclusión suene verdadera no alcanza: no se sigue de estas premisas." },
  { id: "IC2", validez: "inválido", credibilidad: "creíble", p1: "Ninguna mariposa es un mamífero.", p2: "Algunos animales domésticos son mamíferos.", c: "algunas mariposas no son animales domésticos",
    porque: "Las premisas no dicen nada sobre si las mariposas son animales domésticos. Todas las mariposas podrían ser domésticas y las dos premisas seguirían siendo verdaderas (los mamíferos domésticos serían otros animales). Que la conclusión suene verdadera no alcanza: no se sigue de estas premisas." },
  { id: "IN1", validez: "inválido", credibilidad: "no creíble", p1: "Ningún perro es un felino.", p2: "Algunos mamíferos son felinos.", c: "algunos perros no son mamíferos",
    porque: "Que algunos mamíferos sean felinos no dice nada sobre los perros. Las dos premisas son verdaderas en el mundo real y, sin embargo, la conclusión es falsa: todos los perros son mamíferos. Si pueden darse premisas verdaderas con conclusión falsa, el argumento no es válido. No se sigue." },
  { id: "IN2", validez: "inválido", credibilidad: "no creíble", p1: "Ninguna rosa es una planta acuática.", p2: "Algunas flores son plantas acuáticas.", c: "algunas rosas no son flores",
    porque: "Las dos premisas son verdaderas en el mundo real y, sin embargo, la conclusión es falsa: todas las rosas son flores. Si pueden darse premisas verdaderas con conclusión falsa, el argumento no es válido. No se sigue." }
];

const esc = Ejercicio.esc;
const pct = Ejercicio.pct;
const votos = Ejercicio.votos;

// «Se sigue» (opción 0) es lo correcto en los argumentos válidos.
const trials = ARGUMENTOS.map(a => ({ ...a, fields: { validez: a.validez, credibilidad: a.credibilidad }, correct: a.validez === "válido" ? 0 : 1 }));

function celda(ctx, validez, credibilidad) {
  return ctx.trials
    .filter(t => (!validez || t.validez === validez) && (!credibilidad || t.credibilidad === credibilidad))
    .reduce((acc, t) => {
      const [si, no] = ctx.counts(t.id);
      return { si: acc.si + si, total: acc.total + si + no };
    }, { si: 0, total: 0 });
}
const tasa = c => (c.total ? c.si / c.total : NaN);
const puntos = (a, b) => (isNaN(a) || isNaN(b) ? "—" : `${a >= b ? "+" : "−"}${Math.abs(Math.round((a - b) * 100))} puntos`);

// Cuadro del juego: validez × credibilidad. `aqui` resalta la celda del argumento que se acaba de votar.
function cuadroDelJuego(t) {
  const celdaHtml = (validez, credibilidad, texto, nota) => {
    const aqui = t.validez === validez && t.credibilidad === credibilidad;
    return `<td${aqui ? ' class="here"' : ""}>${aqui ? '<span class="ex-fb-tag">Este argumento</span><br>' : ""}${texto}<small>${nota}</small></td>`;
  };
  return `
    <table class="ex-fb-grid">
      <thead><tr><th></th><th scope="col">Conclusión creíble</th><th scope="col">Conclusión no creíble</th></tr></thead>
      <tbody>
        <tr><th scope="row">Argumento válido</th>${celdaHtml("válido", "creíble", "Se sigue y suena bien", "La lógica y la creencia coinciden")}${celdaHtml("válido", "no creíble", "Se sigue, aunque suene mal", "La lógica y la creencia chocan")}</tr>
        <tr><th scope="row">Argumento inválido</th>${celdaHtml("inválido", "creíble", "No se sigue, aunque suene bien", "La lógica y la creencia chocan")}${celdaHtml("inválido", "no creíble", "No se sigue y suena mal", "La lógica y la creencia coinciden")}</tr>
      </tbody>
    </table>`;
}

Ejercicio({
  id: "sesgo-creencia",
  title: "Sesgo de creencia: ¿se sigue la conclusión?",
  backHref: "../index.html#slide-20",
  options: [{ label: "Se sigue" }, { label: "No se sigue" }],
  trials,

  intro: ctx => `
    <h1 class="ex-heading">¿Se sigue la conclusión?</h1>
    <p class="ex-lead">Ocho argumentos. En cada uno, el grupo vota si la conclusión se sigue necesariamente de las premisas.</p>
    <ol class="ex-steps">
      <li>Se muestra un argumento por vez, en orden aleatorio.</li>
      <li>Suponé que las dos premisas son verdaderas, aunque alguna te parezca falsa.</li>
      <li>Se vota a mano alzada y con la cabeza baja: una opción por vez.</li>
      <li>${ctx.feedbackOn() ? "Después de cada votación se muestra la respuesta correcta y por qué lo es." : "No se muestra ninguna respuesta hasta el final."}</li>
    </ol>
    <p class="ex-hint">Quien presenta: tecla 1 = «Se sigue», tecla 2 = «No se sigue», Retroceso deshace el último voto, → ${ctx.feedbackOn() ? "muestra la respuesta y, después, pasa al siguiente" : "avanza"}.</p>`,

  trial: t => `
    <p class="ex-instruction">Suponé que las dos primeras afirmaciones son verdaderas. ¿La conclusión se sigue necesariamente de ellas?</p>
    <div class="ex-argument">
      <p>${esc(t.p1)}</p>
      <p>${esc(t.p2)}</p>
      <p class="ex-conclusion">Por lo tanto, ${esc(t.c)}.</p>
    </div>`,

  feedback: t => `
    <h3 class="ex-fb-sub">¿Por qué?</h3>
    <p>${esc(t.porque)}</p>
    <h3 class="ex-fb-sub">Cómo es el juego</h3>
    <p>Se juzga si el argumento es <strong>válido</strong>: si las premisas fueran verdaderas, ¿la conclusión tendría que serlo? No se juzga si la conclusión es <strong>creíble</strong>, es decir, si coincide con lo que sabemos del mundo. Combinadas, hay cuatro tipos de argumento: en dos, la lógica y la creencia coinciden; en los otros dos, chocan.</p>
    ${cuadroDelJuego(t)}`,

  results(ctx) {
    const fila = (validez, nota) => `<tr><th scope="row">Argumento ${validez}<small>${nota}</small></th>${["creíble", "no creíble"].map(cred => {
      const c = celda(ctx, validez, cred);
      return `<td class="num">${pct(c.si, c.total)}<small>${votos(c.total)}</small></td>`;
    }).join("")}</tr>`;
    const detalle = ctx.trials.map(t => {
      const [si, no] = ctx.counts(t.id);
      return `<tr><td>Por lo tanto, ${esc(t.c)}.</td><td>${t.validez}</td><td>${t.credibilidad}</td><td class="num">${si}</td><td class="num">${no}</td></tr>`;
    }).join("");
    return `
      <h1 class="ex-heading">¿Cuándo aceptó el grupo que «se sigue»?</h1>
      <p class="ex-lead">Porcentaje de votos «Se sigue» según la validez del argumento y la credibilidad de su conclusión.</p>
      <table class="ex-table ex-grid">
        <thead><tr><th></th><th scope="col">Conclusión creíble</th><th scope="col">Conclusión no creíble</th></tr></thead>
        <tbody>${fila("válido", "lo correcto es aceptar")}${fila("inválido", "lo correcto es rechazar")}</tbody>
      </table>
      <div class="ex-effects">
        <div class="ex-argument"><strong>Efecto de la validez</strong>${puntos(tasa(celda(ctx, "válido")), tasa(celda(ctx, "inválido")))} <small>(aceptación de válidos − inválidos)</small></div>
        <div class="ex-argument"><strong>Efecto de la credibilidad</strong>${puntos(tasa(celda(ctx, null, "creíble")), tasa(celda(ctx, null, "no creíble")))} <small>(aceptación de creíbles − no creíbles)</small></div>
      </div>
      <details class="ex-details">
        <summary>Ver los votos por argumento</summary>
        <table class="ex-table">
          <thead><tr><th scope="col">Conclusión</th><th scope="col">Validez</th><th scope="col">Credibilidad</th><th scope="col">Se sigue</th><th scope="col">No se sigue</th></tr></thead>
          <tbody>${detalle}</tbody>
        </table>
      </details>
      <h2 class="ex-sub">Para conversar</h2>
      <ul class="ex-questions">
        <li>Si el criterio fuera sólo la validez, ¿qué porcentaje esperaríamos en cada celda?</li>
        <li>¿Qué cambió cuando la conclusión no era creíble? ¿Y cuando el argumento era inválido?</li>
        <li>¿Qué diferencia hay entre que una conclusión sea verdadera y que se siga de las premisas?</li>
        <li>Con estos datos, ¿qué podemos decir sobre cómo razonó cada persona? ¿Y qué no?</li>
      </ul>`;
  },

  caveat: "Demostración con un solo grupo y ocho argumentos de elaboración didáctica: ilustra el fenómeno, pero no lo prueba. Un patrón del grupo no identifica cómo razonó cada persona ni decide entre lógica mental y modelos mentales."
});
