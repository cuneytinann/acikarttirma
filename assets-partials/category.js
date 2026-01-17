// category.js (Seçenek A: category.json tek sefer fetch + mevcut DOM lazy render korunur)

(async function initCategoryTree() {
  // 1) JSON'dan config yükle
  let menuConfig = [];
  try {
    const res = await fetch("./assets-partials/categories.tr.json", { cache: "no-store" });
    if (!res.ok) throw new Error("categories.tr.json yüklenemedi (HTTP " + res.status + ")");
    menuConfig = await res.json();
  } catch (err) {
    console.error(err);
    // Fail-safe: UI hiç kırılmasın diye boş ağaçla devam
    menuConfig = [];
  }

  // 2) DOM referansları (mevcut isimler korunuyor)
  const treeRoot = document.getElementById("categoriTree");
  const mainToggle = document.getElementById("main-btn");
  const mainToggle2 = document.getElementById("main-btn2");
  const cateList = document.querySelector(".categori-list");
  const filterList = document.querySelector(".filters");

  if (!treeRoot) return;

  // 3) Index: id -> node (O(1) erişim) (mevcut davranış korunur)
  const nodeById = new Map();
  (function indexNodes(nodes) {
    for (const n of nodes || []) {
      if (n?.id) nodeById.set(n.id, n);
      if (Array.isArray(n.children)) indexNodes(n.children);
    }
  })(menuConfig);

  // 4) Dynamic class (mevcut)
  function branchClass(depth) {
    return depth === 0 ? "main-branch" : `node${depth}branch`;
  }

  // 5) Sadece 1 seviyeyi render eder (lazy için kritik) (mevcut)
  function renderLevel(parentUl, nodes, depth) {
    const frag = document.createDocumentFragment();

    for (const n of nodes || []) {
      const li = document.createElement("li");
      li.dataset.id = n.id || "";
      li.dataset.depth = String(depth);

      // Dinamik class (override için)
      li.classList.add(branchClass(depth));

      // CSS için derinlik değişkeni
      li.style.setProperty("--d", depth);

      const hasChildren = Array.isArray(n.children) && n.children.length > 0;
      if (hasChildren) li.setAttribute("aria-expanded", "false");

      const row = document.createElement("div");
      row.className = "cate-row";

      const toggleWrap = document.createElement("div");
      toggleWrap.className = "wrap-areas dfc";
      toggleWrap.style.opacity = "0";

      if (hasChildren) {
        toggleWrap.style.opacity = "1";
        toggleWrap.setAttribute("aria-label", "Alt kategorileri aç/kapat");
      }

      row.appendChild(toggleWrap);

      const title = document.createElement("span");
      title.className = "cate-title";
      title.textContent = n.label ?? "—";
      row.appendChild(title);

      li.appendChild(row);
      frag.appendChild(li);
    }

    parentUl.appendChild(frag);
  }

  // 6) İlk yüklemede SADECE root seviye
  renderLevel(treeRoot, menuConfig, 0);

  // 7) Toggle/Select: tek listener (event delegation)
  treeRoot.addEventListener("click", (e) => {
    const row = e.target.closest(".cate-row");
    if (!row) return;

    const li = row.parentElement;
    const id = li?.dataset?.id;
    if (!id) return;

    const node = nodeById.get(id);
    const hasChildren = node && Array.isArray(node.children) && node.children.length > 0;

    const clickedToggle = e.target.closest(".wrap-areas");
    const clickedTitle = e.target.closest(".cate-title"); // <-- BUG FIX: sizde yorum satırındaydı

    if (!hasChildren) {
      // Yaprak node seçimi (buraya aksiyon bağlayın)
      console.log("Seçildi:", id);
      return;
    }

    // Çocuk varsa: toggle (toggle'a ya da title'a tıklayınca)
    if (clickedToggle || clickedTitle) {
      const expanded = li.getAttribute("aria-expanded") === "true";

      let childUl = li.querySelector(":scope > ul.cate-children");
      if (!childUl) {
        childUl = document.createElement("ul");
        childUl.className = "cate-children";
        childUl.hidden = true;
        li.appendChild(childUl);

        const depth = Number(li.dataset.depth || 0);
        renderLevel(childUl, node.children, depth + 1);
      }

      li.setAttribute("aria-expanded", String(!expanded));
      childUl.hidden = expanded;
    }
  });

  function bindToggle(btn, panel) {
    if (!btn || !panel) return;

    const sync = () =>
      btn.setAttribute(
        "aria-expanded",
        String(getComputedStyle(panel).display !== "none")
      );

    btn.addEventListener("click", () => {
      panel.style.display =
        getComputedStyle(panel).display !== "none" ? "none" : "block";
      sync();
    });

    sync();
    addEventListener("resize", sync);
  }

  // kullanım (mevcut)
  bindToggle(mainToggle, cateList);
  bindToggle(mainToggle2, filterList);
})();
