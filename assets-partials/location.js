(() => {
  const provinceEl = document.getElementById("provinceSelect");
  const districtEl = document.getElementById("districtSelect");
  const neighborhoodEl = document.getElementById("neighborhoodSelect");

  if (!provinceEl || !districtEl || !neighborhoodEl) return;

  const DATA_URL = "./assets-partials/locations.tr.json";

  // Cache
  let dataCache = null;
  const districtsCache = new Map();      // provinceId -> districts[]
  const neighborhoodsCache = new Map();  // districtId  -> neighborhoods[]

  // Race-condition koruması
  let districtReqToken = 0;
  let neighborhoodReqToken = 0;

  const setDisabled = (el, disabled, placeholder) => {
    el.disabled = disabled;
    el.setAttribute("aria-disabled", String(disabled));
    el.innerHTML = `<option value="">${placeholder}</option>`;
  };

  const fillOptions = (el, items, placeholder = "Seçiniz") => {
    const frag = document.createDocumentFragment();

    const first = document.createElement("option");
    first.value = "";
    first.textContent = placeholder;
    frag.appendChild(first);

    for (const item of items) {
      const opt = document.createElement("option");
      opt.value = item.id;
      opt.textContent = item.name;
      frag.appendChild(opt);
    }

    el.innerHTML = "";
    el.appendChild(frag);
  };

  const loadDataOnce = async () => {
    if (dataCache) return dataCache;

    const res = await fetch(DATA_URL, { cache: "force-cache" });
    if (!res.ok) throw new Error(`Lokasyon verisi yüklenemedi: ${res.status}`);
    dataCache = await res.json();
    return dataCache;
  };

  const getDistricts = async (provinceId) => {
    if (districtsCache.has(provinceId)) return districtsCache.get(provinceId);
    const data = await loadDataOnce();
    const districts = data.districtsByProvince?.[provinceId] ?? [];
    districtsCache.set(provinceId, districts);
    return districts;
  };

  const getNeighborhoods = async (districtId) => {
    if (neighborhoodsCache.has(districtId)) return neighborhoodsCache.get(districtId);
    const data = await loadDataOnce();
    const neighborhoods = data.neighborhoodsByDistrict?.[districtId] ?? [];
    neighborhoodsCache.set(districtId, neighborhoods);
    return neighborhoods;
  };

  // Init: sadece iller
  (async () => {
    try {
      const data = await loadDataOnce();
      fillOptions(provinceEl, data.provinces, "Seçiniz");
      setDisabled(districtEl, true, "Önce il seçiniz");
      setDisabled(neighborhoodEl, true, "Önce ilçe seçiniz");
    } catch (e) {
      console.error(e);
      setDisabled(provinceEl, true, "İller yüklenemedi");
      setDisabled(districtEl, true, "Önce il seçiniz");
      setDisabled(neighborhoodEl, true, "Önce ilçe seçiniz");
    }
  })();

  provinceEl.addEventListener("change", async () => {
    const provinceId = provinceEl.value;

    setDisabled(districtEl, true, provinceId ? "Yükleniyor..." : "Önce il seçiniz");
    setDisabled(neighborhoodEl, true, "Önce ilçe seçiniz");
    if (!provinceId) return;

    const token = ++districtReqToken;
    try {
      const districts = await getDistricts(provinceId);
      if (token !== districtReqToken) return;
      fillOptions(districtEl, districts, "Seçiniz");
      districtEl.disabled = false;
      districtEl.setAttribute("aria-disabled", "false");
    } catch (e) {
      console.error(e);
      setDisabled(districtEl, true, "İlçeler yüklenemedi");
    }
  });

  districtEl.addEventListener("change", async () => {
    const districtId = districtEl.value;

    setDisabled(neighborhoodEl, true, districtId ? "Yükleniyor..." : "Önce ilçe seçiniz");
    if (!districtId) return;

    const token = ++neighborhoodReqToken;
    try {
      const neighborhoods = await getNeighborhoods(districtId);
      if (token !== neighborhoodReqToken) return;
      fillOptions(neighborhoodEl, neighborhoods, "Seçiniz");
      neighborhoodEl.disabled = false;
      neighborhoodEl.setAttribute("aria-disabled", "false");
    } catch (e) {
      console.error(e);
      setDisabled(neighborhoodEl, true, "Mahalleler yüklenemedi");
    }
  });
})();
