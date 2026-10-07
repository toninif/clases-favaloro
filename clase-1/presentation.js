"use strict";

(() => {
  const slides = [...document.querySelectorAll(".slide")];
  const previous = document.getElementById("previous");
  const next = document.getElementById("next");
  const counter = document.getElementById("counter");
  const indexDialog = document.getElementById("index-dialog");
  const notesDialog = document.getElementById("notes-dialog");
  const helpDialog = document.getElementById("help-dialog");
  const fullscreenButton = document.getElementById("fullscreen");
  let current = 0;

  function resize() {
    const scale = Math.min((window.innerWidth - 32) / 1440, (window.innerHeight - 88) / 810);
    document.documentElement.style.setProperty("--slide-scale", String(Math.max(0.1, scale)));
  }

  function readHash() {
    const match = window.location.hash.match(/^#(?:slide-)?(\d+)$/);
    return match ? Number(match[1]) - 1 : 0;
  }

  function updateNotes() {
    document.getElementById("notes-slide-title").textContent = `${current + 1}. ${slides[current].dataset.title}`;
    document.getElementById("notes-content").textContent = slides[current].querySelector(".speaker-notes")?.textContent.trim() || "Sin notas para esta diapositiva.";
  }

  function goTo(index, updateHash = true, scroll = true) {
    current = Math.max(0, Math.min(slides.length - 1, index));
    slides.forEach((slide, i) => { slide.hidden = i !== current; });
    previous.disabled = current === 0;
    next.disabled = current === slides.length - 1;
    counter.textContent = `${current + 1} / ${slides.length}`;
    document.getElementById("current-block").textContent = slides[current].dataset.block;
    document.getElementById("progress-bar").style.width = `${(current + 1) / slides.length * 100}%`;
    document.title = `${current + 1}. ${slides[current].dataset.title} · Psicología del Pensamiento`;
    document.querySelectorAll(".index-entry").forEach((button, i) => {
      if (i === current) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    });
    updateNotes();
    if (updateHash) history.replaceState(null, "", `#slide-${current + 1}`);
    if (scroll) window.scrollTo({ top: 0, behavior: "instant" });
  }

  function openDialog(dialog) {
    document.querySelectorAll("dialog[open]").forEach(open => open.close());
    dialog.showModal();
    if (dialog === indexDialog) {
      const active = dialog.querySelector('[aria-current="true"]');
      active?.scrollIntoView({ block: "center" });
      active?.focus({ preventScroll: true });
    }
  }

  slides.forEach((slide, i) => {
    slide.setAttribute("role", "group");
    slide.setAttribute("aria-roledescription", "diapositiva");
    slide.setAttribute("aria-label", `${i + 1} de ${slides.length}: ${slide.dataset.title}`);
    if (!slide.classList.contains("cover")) {
      const footer = document.createElement("footer");
      footer.className = "slide-footer";
      const course = document.createElement("span");
      course.textContent = "UF - Procesos Básicos III";
      footer.append(course);
      slide.append(footer);
    }
  });

  let lastBlock = "";
  const indexContainer = document.getElementById("slide-index");
  slides.forEach((slide, i) => {
    if (slide.dataset.block !== lastBlock) {
      const heading = document.createElement("h3");
      heading.textContent = slide.dataset.block;
      indexContainer.append(heading);
      lastBlock = slide.dataset.block;
    }
    const button = document.createElement("button");
    button.type = "button";
    button.className = "index-entry";
    const number = document.createElement("span");
    number.textContent = String(i + 1).padStart(2, "0");
    button.append(number, document.createTextNode(slide.dataset.title));
    button.addEventListener("click", () => {
      indexDialog.close();
      goTo(i);
      document.getElementById("index-button").focus({ preventScroll: true });
    });
    indexContainer.append(button);
  });

  previous.addEventListener("click", () => goTo(current - 1));
  next.addEventListener("click", () => goTo(current + 1));
  document.getElementById("index-button").addEventListener("click", () => openDialog(indexDialog));
  document.getElementById("notes-button").addEventListener("click", () => openDialog(notesDialog));
  document.getElementById("help-button").addEventListener("click", () => openDialog(helpDialog));

  document.querySelectorAll("dialog").forEach(dialog => {
    dialog.querySelector(".close-dialog").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
  });

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      fullscreenButton.title = "Usá F11 para activar la pantalla completa del navegador.";
      fullscreenButton.textContent = "Pantalla completa: F11";
    }
  }
  fullscreenButton.addEventListener("click", toggleFullscreen);
  document.addEventListener("fullscreenchange", () => {
    fullscreenButton.textContent = document.fullscreenElement ? "Salir de pantalla completa" : "Pantalla completa";
    resize();
  });

  document.addEventListener("keydown", event => {
    if (event.ctrlKey || event.altKey || event.metaKey || document.querySelector("dialog[open]")) return;
    if (event.target.closest("input, textarea, select, [contenteditable='true']")) return;
    const interactive = event.target.closest("button, a, summary");
    if (interactive && (event.key === " " || event.key === "Enter")) return;
    switch (event.key.toLowerCase()) {
      case "arrowright": case "pagedown": case " ": event.preventDefault(); goTo(current + 1); break;
      case "arrowleft": case "pageup": event.preventDefault(); goTo(current - 1); break;
      case "home": event.preventDefault(); goTo(0); break;
      case "end": event.preventDefault(); goTo(slides.length - 1); break;
      case "i": openDialog(indexDialog); break;
      case "n": openDialog(notesDialog); break;
      case "f": toggleFullscreen(); break;
      case "?": openDialog(helpDialog); break;
    }
  });

  let touchStart = null;
  const viewport = document.getElementById("viewport");
  viewport.addEventListener("touchstart", event => {
    if (event.touches.length !== 1 || event.target.closest("a, button, summary")) { touchStart = null; return; }
    touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }, { passive: true });
  viewport.addEventListener("touchend", event => {
    if (!touchStart || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) goTo(current + (dx < 0 ? 1 : -1));
    touchStart = null;
  }, { passive: true });
  viewport.addEventListener("touchcancel", () => { touchStart = null; }, { passive: true });

  window.addEventListener("resize", resize);
  window.addEventListener("hashchange", () => goTo(readHash(), false));
  document.body.classList.add("ready");
  resize();
  goTo(readHash(), true, false);
})();
