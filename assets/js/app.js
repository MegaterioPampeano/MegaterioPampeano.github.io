// Silenciar BicC — interacciones. Sin dependencias.
// Cinco cosas: progreso de lectura, nav pegajosa, aparición por scroll, gráfico que crece,
// fases desplegables y lightbox de las fotos.

const $ = (s, ctx = document) => ctx.querySelector(s);
const $$ = (s, ctx = document) => [...ctx.querySelectorAll(s)];

/* ---------------------------------------------------------------- progreso */
const barra = $("#progreso-barra");
const rail = $("#rail");
const railBarra = $("#rail-barra");
const pasos = $$("#rail-pasos li");
const secciones = pasos
  .map((li) => document.getElementById(li.dataset.paso))
  .filter(Boolean);

function progreso() {
  const alto = document.documentElement.scrollHeight - window.innerHeight;
  const pct = alto > 0 ? Math.min(100, (window.scrollY / alto) * 100) : 0;
  barra.style.width = `${pct}%`;

  // rail: aparece después del hero y se apaga en el pie
  const enRecorrido = window.scrollY > window.innerHeight * 0.7 &&
    window.scrollY < document.documentElement.scrollHeight - window.innerHeight * 1.2;
  rail.classList.toggle("visible", enRecorrido);

  // paso activo: la última sección cuyo borde superior ya pasó el 45% de la pantalla
  let activo = 0;
  secciones.forEach((sec, i) => {
    if (sec.getBoundingClientRect().top < window.innerHeight * 0.45) activo = i;
  });
  pasos.forEach((li, i) => li.classList.toggle("activo", i === activo));
  if (secciones.length > 1) {
    const desde = secciones[0].offsetTop - window.innerHeight * 0.4;
    const hasta = secciones[secciones.length - 1].offsetTop - window.innerHeight * 0.4;
    const avance = Math.min(1, Math.max(0, (window.scrollY - desde) / Math.max(1, hasta - desde)));
    railBarra.style.height = `${avance * 100}%`;
  }

  // nav pegajosa
  $("#nav").classList.toggle("pegado", window.scrollY > 40);
}

let tick = false;
addEventListener("scroll", () => {
  if (tick) return;
  tick = true;
  requestAnimationFrame(() => { progreso(); tick = false; });
}, { passive: true });

/* ------------------------------------------------------------ plan experimental (pestañas) */
{
  const tabs = $$(".plan-tab");
  const paneles = $$(".plan-panel");
  if (tabs.length && paneles.length === tabs.length) {
    const activar = (i) => {
      tabs.forEach((t, k) => {
        const si = k === i;
        t.classList.toggle("activo", si);
        t.setAttribute("aria-selected", si ? "true" : "false");
        t.tabIndex = si ? 0 : -1;
        paneles[k].classList.toggle("activo", si);
      });
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => activar(i));
      t.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          const d = e.key === "ArrowRight" ? 1 : -1;
          const j = (i + d + tabs.length) % tabs.length;
          activar(j); tabs[j].focus();
        }
      });
    });
  }
}

/* ------------------------------------------------------------ scroll reveal */
const observador = new IntersectionObserver((entradas) => {
  for (const e of entradas) {
    if (e.isIntersecting) {
      e.target.classList.add("visto");
      observador.unobserve(e.target);
    }
  }
}, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

$$(".reveal").forEach((el) => observador.observe(el));

/* --------------------------------------------------------- gráfico pérdidas */
function animarBarras() {
  const caja = $("#barras-perdidas");
  if (!caja || caja.dataset.hecho) return;
  const max = 20; // escala del eje, en millones de toneladas
  $$(".barra", caja).forEach((b, i) => {
    const v = parseFloat(b.dataset.valor);
    setTimeout(() => {
      b.querySelector(".barra-relleno").style.width = `${(v / max) * 100}%`;
    }, 120 + i * 130);
  });
  caja.dataset.hecho = "1";
}

const obsFig = new IntersectionObserver((entradas) => {
  entradas.forEach((e) => { if (e.isIntersecting) { animarBarras(); obsFig.disconnect(); } });
}, { threshold: 0.3 });
if ($("#fig-perdidas")) obsFig.observe($("#fig-perdidas"));

/* ------------------------------------------------------------------- fases */
$$(".fase").forEach((fase) => {
  const boton = $(".fase-toggle", fase);
  const cabecera = $("header", fase);
  const abrir = (si) => {
    fase.classList.toggle("abierta", si);
    boton.setAttribute("aria-expanded", String(si));
  };
  cabecera.addEventListener("click", () => abrir(!fase.classList.contains("abierta")));
  cabecera.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrir(!fase.classList.contains("abierta")); }
  });
  cabecera.tabIndex = 0;
  boton.addEventListener("click", (e) => { e.stopPropagation(); abrir(!fase.classList.contains("abierta")); });
});
// la primera abierta: muestra cómo se lee el resto
const primera = $(".fase");
if (primera) {
  primera.classList.add("abierta");
  $(".fase-toggle", primera)?.setAttribute("aria-expanded", "true");
}

/* ---------------------------------------------------------------- lightbox */
const cajaFotos = $("#lightbox");
const fotoGrande = $("img", cajaFotos);
$$(".foto img, .persona img, .foto-grupal img").forEach((img) => {
  img.addEventListener("click", () => {
    fotoGrande.src = img.currentSrc || img.src;
    fotoGrande.alt = img.alt;
    cajaFotos.classList.add("abierto");
    cajaFotos.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  });
});
function cerrarLightbox() {
  cajaFotos.classList.remove("abierto");
  cajaFotos.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}
cajaFotos.addEventListener("click", (e) => {
  if (e.target === cajaFotos || e.target.classList.contains("lightbox-cerrar")) cerrarLightbox();
});
addEventListener("keydown", (e) => {
  if (e.key === "Escape") { cerrarLightbox(); menuAbierto(false); }
});

/* -------------------------------------------------------------------- menú */
const botonMenu = $("#nav-menu");
const links = $(".nav-links");
function menuAbierto(si) {
  links.classList.toggle("abierto", si);
  botonMenu.setAttribute("aria-expanded", String(si));
}
botonMenu.addEventListener("click", () => menuAbierto(!links.classList.contains("abierto")));
$$(".nav-links a").forEach((a) => a.addEventListener("click", () => menuAbierto(false)));

/* --------------------------------------------------------------- partículas */
// Unas chispas lentas en el hero: dan profundidad sin costo.
const particulas = $(".hero-particulas");
if (particulas && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const NS = "http://www.w3.org/2000/svg";
  for (let i = 0; i < 22; i++) {
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("cx", String(180 + Math.random() * 540));
    c.setAttribute("cy", String(80 + Math.random() * 520));
    c.setAttribute("r", String(0.8 + Math.random() * 1.6));
    c.setAttribute("opacity", String(0.15 + Math.random() * 0.45));
    c.style.animation = `flotar ${9 + Math.random() * 9}s ease-in-out ${Math.random() * 6}s infinite`;
    particulas.appendChild(c);
  }
  const estilo = document.createElement("style");
  estilo.textContent = `@keyframes flotar {
    0%,100% { transform: translateY(0); opacity: .2; }
    50% { transform: translateY(-16px); opacity: .8; }
  }`;
  document.head.appendChild(estilo);
}

progreso();

/* ------------------------------------------- ampliar figuras (botón e imagen) */
{
  const abrirFoto = (src, alt) => {
    if (!cajaFotos || !src) return;
    fotoGrande.src = src;
    fotoGrande.alt = alt || "";
    cajaFotos.classList.add("abierto");
    cajaFotos.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };
  $$(".zoom").forEach((b) => {
    b.addEventListener("click", () => {
      const cap = b.closest("figcaption");
      abrirFoto(b.dataset.img, cap ? cap.innerText.replace(/\s+/g, " ").trim().slice(0, 140) : "");
    });
  });
  $$(".figura-marco img, .captura-ventana img").forEach((img) => {
    img.style.cursor = "zoom-in";
    img.addEventListener("click", () => abrirFoto(img.currentSrc || img.src, img.alt));
  });
}
