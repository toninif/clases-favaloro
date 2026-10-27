"use strict";

// Torre de Hanoi interactiva: clic en un pivote toma el disco de arriba; clic en otro lo deja.
(() => {
  const names = ["A", "B", "C"];

  document.querySelectorAll(".hanoi").forEach(root => {
    const discs = Number(root.dataset.discs) || 3;
    const minimum = 2 ** discs - 1;
    const pegs = [...root.querySelectorAll(".hanoi-peg")];
    const status = root.querySelector(".hanoi-status");
    const counter = root.querySelector(".hanoi-count output");
    const idle = "Hacé clic en un pivote para tomar el disco de arriba.";
    let towers = [];
    let selected = null;
    let moves = 0;
    let history = [];
    const undo = document.createElement("button");
    undo.type = "button"; undo.className = "activity-button hanoi-undo"; undo.textContent = "Deshacer";
    root.querySelector(".hanoi-reset").after(undo);
    undo.addEventListener("click", () => {
      if (!history.length) return;
      towers = history.pop(); moves--; selected = null; status.textContent = idle; render();
    });

    function render() {
      pegs.forEach((peg, i) => {
        peg.querySelectorAll(".disc").forEach(disc => disc.remove());
        towers[i].forEach((size, level) => {
          const disc = document.createElement("span");
          disc.className = "disc";
          disc.dataset.size = String(size);
          disc.style.setProperty("--size", String(size));
          disc.style.setProperty("--level", String(level));
          if (selected === i && level === towers[i].length - 1) disc.classList.add("lifted");
          peg.append(disc);
        });
        peg.setAttribute("aria-pressed", String(selected === i));
        const content = towers[i].length ? `discos ${towers[i].join(", ")}` : "vacío";
        peg.setAttribute("aria-label", `Pivote ${names[i]}: ${content}`);
      });
      counter.textContent = String(moves);
      undo.disabled = !history.length;
    }

    function start() {
      towers = [Array.from({ length: discs }, (_, k) => discs - k), [], []];
      selected = null;
      moves = 0; history = [];
      status.textContent = idle;
      render();
    }

    pegs.forEach((peg, i) => peg.addEventListener("click", () => {
      if (towers[2].length === discs) return;
      if (selected === null) {
        if (!towers[i].length) {
          status.textContent = `El pivote ${names[i]} está vacío.`;
          return;
        }
        selected = i;
        status.textContent = `Tomaste el disco de ${names[i]}. Elegí dónde dejarlo.`;
      } else if (selected === i) {
        selected = null;
        status.textContent = idle;
      } else {
        const disc = towers[selected].at(-1);
        const top = towers[i].at(-1);
        if (top !== undefined && top < disc) {
          status.textContent = "No se puede poner un disco sobre uno más chico.";
        } else {
          history.push(towers.map(tower => [...tower]));
          towers[selected].pop();
          towers[i].push(disc);
          moves += 1;
          if (towers[2].length === discs) {
            status.textContent = moves === minimum
              ? `¡Resuelto en ${moves} movimientos, el mínimo posible!`
              : `¡Resuelto en ${moves} movimientos! El mínimo es ${minimum}.`;
          } else {
            status.textContent = idle;
          }
        }
        selected = null;
      }
      render();
    }));

    root.querySelector(".hanoi-reset").addEventListener("click", start);
    start();
  });
})();
