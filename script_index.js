/* =========================
   Draggable Windows + Controls
   ========================= */
(() => {
  let topZ = 100;
  document.querySelectorAll(".win").forEach(makeDraggable);

  function makeDraggable(win) {
    const bar = win.querySelector(".titlebar");
    const btnArea = win.querySelector(".btns");
    let dragging = false,
      dx = 0,
      dy = 0;

    // Bring window to front on click
    win.addEventListener("pointerdown", () => {
      win.style.zIndex = ++topZ;
      document
        .querySelectorAll(".win")
        .forEach((w) => w.classList.remove("active"));
      win.classList.add("active");
    });

    // Start drag (ignore clicks on interactive elements)
    bar.addEventListener("pointerdown", (e) => {
      if (
        e.target.closest(".btns") ||
        e.target.closest("button") ||
        e.target.closest("a") ||
        e.target.closest('input, textarea, select, [role="button"]')
      ) {
        return; // skip drag, let the element handle the click
      }
      dragging = true;
      e.preventDefault();
      bar.setPointerCapture(e.pointerId);
      dx = e.clientX - win.offsetLeft;
      dy = e.clientY - win.offsetTop;
    });

    // Move window
    bar.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      win.style.left = e.clientX - dx + "px";
      win.style.top = e.clientY - dy + "px";
    });

    // End drag
    ["pointerup", "pointercancel", "lostpointercapture"].forEach((ev) =>
      bar.addEventListener(ev, () => (dragging = false))
    );

    // Prevent drag when clicking buttons
    btnArea?.addEventListener("pointerdown", (e) => e.stopPropagation());
    btnArea?.addEventListener("click", (e) => e.stopPropagation());

    // Close button
    win.querySelector(".close")?.addEventListener("click", (e) => {
      e.stopPropagation();
      win.remove();
    });

    // Minimize button
    win.querySelector(".min")?.addEventListener("click", (e) => {
      e.stopPropagation();
      const c = win.querySelector(".content");
      c.style.display = c.style.display === "none" ? "block" : "none";
    });
  }
})();

/* =========================
   DVD Bouncer
   ========================= */
(() => {
  const el = document.getElementById("dvd");
  if (!el) return;

  // Config
  const SPEED = 260; // px/sec
  const COLOR_SHIFT_ON_HIT = true; // hue rotate on bounce

  // Size / bounds cache
  let vw = innerWidth,
    vh = innerHeight,
    w = 120,
    h = 120;
  function measure() {
    vw = innerWidth;
    vh = innerHeight;
    const r = el.getBoundingClientRect();
    if (r.width) w = r.width;
    if (r.height) h = r.height;
  }
  addEventListener("resize", measure);
  if (el.complete) measure();
  else el.addEventListener("load", measure);

  // Start position/velocity (random diagonal)
  function randSign() {
    return Math.random() < 0.5 ? -1 : 1;
  }
  let x = Math.random() * (vw - w);
  let y = Math.random() * (vh - h);
  let angle = Math.random() * Math.PI * 2;
  let vx = Math.cos(angle) * SPEED * randSign();
  let vy = Math.sin(angle) * SPEED * randSign();

  // Tint on bounce
  let hue = 0;
  function tint() {
    hue = (hue + 37) % 360;
    el.style.filter = `hue-rotate(${hue}deg) drop-shadow(0 4px 16px rgba(0,0,0,.35))`;
  }

  let last = performance.now();
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    x += vx * dt;
    y += vy * dt;

    const maxX = vw - w;
    const maxY = vh - h;
    let bounced = false;

    if (x <= 0) {
      x = 0;
      vx = Math.abs(vx);
      bounced = true;
    }
    if (x >= maxX) {
      x = maxX;
      vx = -Math.abs(vx);
      bounced = true;
    }
    if (y <= 0) {
      y = 0;
      vy = Math.abs(vy);
      bounced = true;
    }
    if (y >= maxY) {
      y = maxY;
      vy = -Math.abs(vy);
      bounced = true;
    }

    if (bounced && COLOR_SHIFT_ON_HIT) tint();

    el.style.transform = `translate(${x}px, ${y}px)`;
    requestAnimationFrame(tick);
  }

  measure();
  requestAnimationFrame(tick);
})();

/* =========================
   Click Sound
   ========================= */
document.addEventListener("DOMContentLoaded", () => {
  let clickSound = null;

  // Prepare once the user interacts (required on iOS/Safari)
  function initSoundOnce() {
    clickSound = new Audio("sound/clicksound.wav"); // ensure path is correct
    clickSound.preload = "auto";
    clickSound.volume = 0.9;

    clickSound.addEventListener("error", () => {
      console.error("Could not load sound. Check the path:", clickSound.src);
    });

    document.removeEventListener("pointerdown", initSoundOnce, true);
  }

  // First gesture anywhere creates the audio element
  document.addEventListener("pointerdown", initSoundOnce, true);

  // Play on pointerdown so it fires before navigation
  document.addEventListener(
    "pointerdown",
    (e) => {
      const target = e.target.closest('a, button, [role="button"]');
      if (!target || !clickSound) return;

      try {
        clickSound.currentTime = 0;
        clickSound.play().catch((err) => {
          console.warn("Sound play blocked:", err);
        });
      } catch (err) {
        console.warn("Sound error:", err);
      }
    },
    true
  );
});
