(async function () {
  // Navbar istenmeyen sayfalarda kapatılabilsin:
  // <body data-navbar="off">
  if (document.body.dataset.navbar === "off") return;

  const root = document.getElementById("navbar-root");
  if (!root) return;

  try {
    
    const res = await fetch("./assets-partials/navbar.html", { cache: "no-store" });
    
    // const res = await fetch("/assets-partials/navbar.html", { cache: "force-cache" }); geçiçi olarak

    if (!res.ok) throw new Error("Navbar yüklenemedi: " + res.status);

    root.innerHTML = await res.text();

    root.addEventListener("click", (e) => {
  const target = e.target.closest("[data-href]");
  if (!target) return;

  const url = target.dataset.href;
  if (url) {
    window.location.href = url;
  }
});


    // İsteğe bağlı: mobilde fixed navbar varsa içerik üstten taşmasın
    // Basit bir offset (navbar yüksekliği değişiyorsa işe yarar)
    const navbarEl = document.getElementById("app-navbar");
    if (navbarEl) {
      const h = navbarEl.getBoundingClientRect().height;
      document.documentElement.style.setProperty("--navbar-h", h + "px");
    }
  } catch (err) {
    console.error(err);
  }
})();
