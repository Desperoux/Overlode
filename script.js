// Overlode website: hero stack, step line, the progression demo, the scanner demo and the FAQ.
(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // The entrance animation takes about 1.4s; after that, make sure nothing is left hidden.
  setTimeout(() => document.documentElement.classList.add("motion-done"), 2000);

  /* ---------- Nav ---------- */
  const nav = document.querySelector("[data-nav]");
  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 24);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Hero: three weeks of double progression on a weight stack ---------- */
  const stack = document.querySelector("[data-stack]");
  if (stack) {
    const plates = [...stack.querySelectorAll("[data-plates] li")];
    const pin = stack.querySelector("[data-pin]");
    const weeks = [...stack.querySelectorAll("[data-weeks] li")];
    const next = stack.querySelector("[data-next]");
    const note = stack.querySelector("[data-note]");

    const states = [
      { pin: 60, next: "60 kg × 11", note: "In range. Keep 60 kg and add a rep." },
      { pin: 60, next: "60 kg × 12", note: "Nearly there. Push the last sets to 12." },
      { pin: 65, next: "65 kg × 8", note: "12 reps on every set. Time to add weight." }
    ];

    const setPin = (kg) => {
      const index = plates.findIndex((p) => Number(p.dataset.kg) === kg);
      const plate = plates[index];
      const y = plate.offsetTop + plate.offsetHeight / 2 - pin.offsetHeight / 2;
      pin.style.setProperty("--pin-y", `${y}px`);
      plates.forEach((p, i) => {
        p.classList.toggle("is-lifted", i <= index);
        p.classList.toggle("is-pinned", i === index);
      });
      return index;
    };

    // One rep: the selected plates rise and settle.
    const lift = (index) => {
      if (reduceMotion) return;
      plates.forEach((p, i) => p.style.setProperty("--lift", i <= index ? "-12px" : "0px"));
      setTimeout(() => plates.forEach((p) => p.style.setProperty("--lift", "0px")), 520);
    };

    const swap = (el, text) => {
      if (el.textContent === text) return;
      el.textContent = text;
      el.classList.remove("swap");
      void el.offsetWidth;
      el.classList.add("swap");
    };

    let step = 0;
    let timer = null;

    const show = (i) => {
      const state = states[i];
      weeks.forEach((w, n) => {
        w.classList.toggle("is-active", n === i);
        w.classList.toggle("is-done", n < i);
      });
      const index = setPin(state.pin);
      lift(index);
      swap(next, state.next);
      swap(note, state.note);
    };

    const play = () => {
      if (timer) return;
      timer = setInterval(() => {
        step = (step + 1) % states.length;
        show(step);
      }, 2600);
    };
    const pause = () => {
      clearInterval(timer);
      timer = null;
    };

    // Lay out once fonts have settled so the pin lines up with its plate.
    const start = () => {
      if (reduceMotion) {
        show(states.length - 1);
        return;
      }
      show(0);
      new IntersectionObserver(([entry]) => (entry.isIntersecting ? play() : pause()), { threshold: 0.3 }).observe(stack);
    };
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(start);
    window.addEventListener("resize", () => setPin(states[step].pin));
  }

  /* ---------- How it works: the joining line draws with scroll ---------- */
  const stepsList = document.querySelector("[data-steps]");
  if (stepsList) {
    const items = [...stepsList.querySelectorAll(".step")];
    const update = () => {
      const rect = stepsList.getBoundingClientRect();
      const viewport = window.innerHeight;
      // 0 when the list's top reaches 85% of the screen, 1 when its bottom reaches 55%.
      const start = viewport * 0.85;
      const end = viewport * 0.55;
      const progress = Math.min(1, Math.max(0, (start - rect.top) / (start - end + rect.height * 0.5)));
      const drawn = reduceMotion ? 1 : progress;
      stepsList.style.setProperty("--drawn", drawn.toFixed(3));
      items.forEach((item, i) => item.classList.toggle("is-lit", drawn >= i / (items.length - 1) - 0.02));
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---------- Try it: a simplified double progression ---------- */
  const tryPanel = document.querySelector("[data-try]");
  if (tryPanel) {
    const sets = [...tryPanel.querySelectorAll("[data-set]")];
    const result = tryPanel.querySelector("[data-result]");
    const why = tryPanel.querySelector("[data-why]");
    const weight = 60;
    const increment = 2.5;
    const low = 8;
    const high = 12;

    const readReps = () => sets.map((s) => Number(s.querySelector("[data-reps]").textContent));

    const decide = (reps) => {
      const lowest = Math.min(...reps);
      if (reps.every((r) => r >= high)) {
        return [`${weight + increment} kg × ${low}`, `${high} reps on every set. Add ${increment} kg and build back up from ${low}.`];
      }
      if (reps.every((r) => r >= low)) {
        return [`${weight} kg × ${Math.min(high, lowest + 1)}`, "In range. Keep the weight and add a rep to your weakest set."];
      }
      if (reps.filter((r) => r < low).length >= 2 && lowest <= low - 3) {
        return [`${weight - increment} kg × ${low}`, "Well short of the range. Ease off a little and rebuild."];
      }
      return [`${weight} kg × ${low}`, `Below ${low} on some sets. Keep the weight and aim for ${low} on every set.`];
    };

    const render = () => {
      const [value, reason] = decide(readReps());
      if (result.textContent !== value) {
        result.textContent = value;
        result.classList.remove("swap");
        void result.offsetWidth;
        result.classList.add("swap");
      }
      why.textContent = reason;
    };

    sets.forEach((set) => {
      const out = set.querySelector("[data-reps]");
      const change = (delta) => {
        out.textContent = String(Math.min(20, Math.max(1, Number(out.textContent) + delta)));
        render();
      };
      set.querySelector("[data-dec]").addEventListener("click", () => change(-1));
      set.querySelector("[data-inc]").addEventListener("click", () => change(1));
    });
    render();
  }

  /* ---------- Pro: scanning a weight stack ---------- */
  const scan = document.querySelector("[data-scan]");
  if (scan) {
    const labels = [...scan.querySelectorAll("[data-scan-labels] li")];
    const photo = scan.querySelector(".scan-photo");
    const status = scan.querySelector("[data-scan-status]");
    const summary = scan.querySelector("[data-scan-summary]");
    const button = scan.querySelector("[data-scan-button]");
    const sweep = 1800;

    summary.textContent = "Not scanned yet";
    let busy = false;

    button.addEventListener("click", () => {
      if (busy) return;
      busy = true;
      labels.forEach((l) => l.classList.remove("is-read"));
      status.textContent = "Reading the stack…";
      summary.textContent = "";
      scan.style.setProperty("--scan-height", `${photo.offsetHeight}px`);
      scan.classList.remove("is-scanning");
      void scan.offsetWidth;
      scan.classList.add("is-scanning");

      const height = photo.offsetHeight;
      labels.forEach((label) => {
        const at = reduceMotion ? 0 : ((label.offsetTop + label.offsetHeight / 2) / height) * sweep * 0.92;
        setTimeout(() => label.classList.add("is-read"), at);
      });
      setTimeout(() => {
        status.textContent = "Read 12 plates on the phone. Nothing uploaded.";
        summary.textContent = "9–59 kg, about 4.5 kg steps";
        summary.classList.remove("swap");
        void summary.offsetWidth;
        summary.classList.add("swap");
        busy = false;
      }, reduceMotion ? 0 : sweep);
    });
  }

  /* ---------- FAQ: smooth open and close ---------- */
  document.querySelectorAll("[data-faq] details").forEach((details) => {
    const summary = details.querySelector("summary");
    const body = details.querySelector(".faq-body");
    summary.addEventListener("click", (event) => {
      if (reduceMotion || !body.animate) return;
      event.preventDefault();
      if (details.open) {
        const animation = body.animate([{ height: `${body.offsetHeight}px` }, { height: "0px" }], { duration: 260, easing: "ease" });
        animation.onfinish = () => (details.open = false);
      } else {
        details.open = true;
        body.animate([{ height: "0px" }, { height: `${body.offsetHeight}px` }], { duration: 300, easing: "ease" });
      }
    });
  });
})();
