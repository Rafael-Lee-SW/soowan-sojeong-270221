(() => {
  const W = window.WEDDING;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const get = (path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), W);

  /* ── 토스트 ── */
  let toastTimer;
  const toast = (msg) => {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("is-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("is-show"), 1800);
  };

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = Object.assign(document.createElement("textarea"), { value: text, style: "position:fixed;opacity:0" });
      document.body.append(ta); ta.select(); document.execCommand("copy"); ta.remove();
    }
    toast("복사되었습니다");
  };

  /* ── config → DOM 바인딩 ── */
  $$("[data-bind]").forEach((el) => { const v = get(el.dataset.bind); if (v != null) el.textContent = v; });
  $$("[data-href]").forEach((el) => { el.href = get(el.dataset.href) || "#"; });
  $$("[data-tel]").forEach((el) => {
    const tel = get(el.dataset.tel);
    if (tel) el.href = `tel:${tel}`; else el.setAttribute("aria-disabled", "true");
  });
  $$("[data-action=copy]").forEach((el) => el.addEventListener("click", () => copy(get(el.dataset.copy))));
  $$("[data-action=toggle]").forEach((el) => el.addEventListener("click", () => { const t = $(el.dataset.target); t.hidden = !t.hidden; }));

  /* ── 테마: 화이트 고정 (?theme=cream 으로 비교만 가능) ── */
  const qTheme = new URLSearchParams(location.search).get("theme");
  if (qTheme) document.documentElement.dataset.theme = qTheme;

  /* ── 봉투 인트로 ── */
  const env = $("#envelope");
  const openEnvelope = () => {
    if (env.classList.contains("is-open")) return;
    env.classList.add("is-open");
    setTimeout(() => { env.classList.add("is-gone"); document.body.style.overflow = ""; }, 700);
  };
  document.body.style.overflow = "hidden";
  env.addEventListener("click", openEnvelope);
  setTimeout(openEnvelope, 2600); // 탭이 없어도 자동으로 열림

  /* ── 스크롤 등장 ── */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  if (new URLSearchParams(location.search).has("reveal")) $$(".reveal").forEach((el) => el.classList.add("is-in")); // 전체 스크린샷용
  else $$(".reveal").forEach((el) => io.observe(el));

  /* ── 달력 ── */
  const wd = new Date(W.date);
  (() => {
    const grid = $("#calendarGrid");
    const y = wd.getFullYear(), m = wd.getMonth(), d = wd.getDate();
    const first = new Date(y, m, 1).getDay();
    const days = new Date(y, m + 1, 0).getDate();
    const html = [];
    ["S", "M", "T", "W", "T", "F", "S"].forEach((n, i) => html.push(`<div class="dow${i === 0 ? " sun" : ""}">${n}</div>`));
    for (let i = 0; i < first; i++) html.push(`<div class="day"></div>`);
    for (let i = 1; i <= days; i++) {
      const dow = (first + i - 1) % 7;
      html.push(`<div class="day${dow === 0 ? " sun" : ""}${i === d ? " is-wedding" : ""}">${i}</div>`);
    }
    grid.innerHTML = html.join("");

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const target = new Date(wd); target.setHours(0, 0, 0, 0);
    const diff = Math.round((target - today) / 864e5);
    const el = $("#dday");
    if (diff > 0) el.innerHTML = `${W.groom.name} ♥ ${W.bride.name}의 결혼식이 <b>${diff}</b>일 남았습니다`;
    else if (diff === 0) el.innerHTML = `오늘, 두 사람이 결혼합니다 <b>D-day</b>`;
    else el.innerHTML = `결혼한 지 <b>${-diff}</b>일이 되었습니다`;
  })();

  /* ── 갤러리 + 라이트박스 ── */
  (() => {
    const P = window.PHOTOS || {};
    const studio = Array.isArray(P) ? P : (P.studio || []);
    const film = Array.isArray(P) ? [] : (P.film || []);
    const photos = studio.concat(film);           // 라이트박스 공통 인덱스
    const grid = $("#galleryStudio"), filmBox = $("#galleryFilm"), strip = $("#galleryFilmStrip");

    if (!studio.length) {
      grid.innerHTML = Array.from({ length: 5 }, (_, i) =>
        `<div class="studio__ph${i === 0 ? " is-full" : ""}">${i === 0 ? "photos coming soon" : ""}</div>`).join("");
    } else {
      // 첫 장 전폭, 이후 2열, 5장마다 전폭 (가로가 긴 사진은 자리에 맞게 전폭)
      grid.innerHTML = studio.map((p, i) => {
        const full = i === 0 || i % 5 === 0 || (p.w && p.h && p.w / p.h > 1.4);
        return `<figure class="studio__item${full ? " is-full" : ""}" data-i="${i}"><img src="${p.thumb || p.src}" alt="" loading="lazy"></figure>`;
      }).join("");
    }
    if (film.length) {
      filmBox.hidden = false;
      strip.innerHTML = film.map((p, i) =>
        `<figure class="polaroid" data-i="${studio.length + i}"><img src="${p.src}" alt="" loading="lazy"><figcaption>${p.caption || `no. ${i + 1}`}</figcaption></figure>`).join("");
    }
    if (!photos.length) return;

    const lb = $("#lightbox"), img = $(".lightbox__img", lb), count = $(".lightbox__count", lb);
    let cur = 0;
    const show = (i) => {
      cur = (i + photos.length) % photos.length;
      img.src = photos[cur].src;
      count.textContent = `${cur + 1} / ${photos.length}`;
    };
    const open = (i) => { show(i); lb.hidden = false; document.body.style.overflow = "hidden"; };
    const close = () => { lb.hidden = true; document.body.style.overflow = ""; };
    $("#gallery").addEventListener("click", (e) => { const f = e.target.closest("[data-i]"); if (f) open(+f.dataset.i); });
    $(".lightbox__close", lb).addEventListener("click", close);
    $(".lightbox__nav--prev", lb).addEventListener("click", () => show(cur - 1));
    $(".lightbox__nav--next", lb).addEventListener("click", () => show(cur + 1));
    lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
    document.addEventListener("keydown", (e) => {
      if (lb.hidden) return;
      if (e.key === "Escape") close(); if (e.key === "ArrowLeft") show(cur - 1); if (e.key === "ArrowRight") show(cur + 1);
    });
    let sx = 0;
    lb.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", (e) => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1)); });
  })();

  /* ── 오시는 길 ── */
  (() => {
    $("#locationGuide").innerHTML = (W.venue.guide || []).map((g) => `<div><dt>${g.title}</dt><dd>${g.text}</dd></div>`).join("");
    const el = $("#map"), v = W.venue;
    // 직접 그린 약도가 있으면 그것을 최우선으로
    if (v.mapImage) {
      const img = new Image(); img.src = v.mapImage; img.alt = "약도"; img.loading = "lazy";
      img.onload = () => { el.innerHTML = ""; el.append(img); };
      return;
    }
    const load = (src) => new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = rej; document.head.append(s); });

    if (W.naverMapClientId) {
      // 네이버 지도 (NCP Dynamic Map + Geocoder)
      load(`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${W.naverMapClientId}&submodules=geocoder`).then(() => {
        const draw = (lat, lng) => {
          el.innerHTML = "";
          const pos = new naver.maps.LatLng(lat, lng);
          const map = new naver.maps.Map(el, { center: pos, zoom: 16, draggable: false, scrollWheel: false, pinchZoom: false, zoomControl: false, mapDataControl: false, logoControlOptions: { position: naver.maps.Position.BOTTOM_LEFT } });
          new naver.maps.Marker({ map, position: pos, title: v.name });
        };
        naver.maps.Service.geocode({ query: v.addressShort }, (st, r) => {
          const a = r && r.v2 && r.v2.addresses && r.v2.addresses[0];
          a ? draw(+a.y, +a.x) : draw(v.lat, v.lng);
        });
      }).catch(() => {});
      return;
    }
    if (W.kakaoMapKey) {
      // 카카오맵 + 주소→좌표
      load(`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${W.kakaoMapKey}&autoload=false&libraries=services`).then(() => kakao.maps.load(() => {
        const draw = (lat, lng) => {
          el.innerHTML = "";
          const pos = new kakao.maps.LatLng(lat, lng);
          const map = new kakao.maps.Map(el, { center: pos, level: 3, draggable: false, scrollwheel: false, disableDoubleClickZoom: true });
          new kakao.maps.Marker({ map, position: pos });
        };
        new kakao.maps.services.Geocoder().addressSearch(v.addressShort, (r, st) => {
          st === kakao.maps.services.Status.OK && r[0] ? draw(+r[0].y, +r[0].x) : draw(v.lat, v.lng);
        });
      })).catch(() => {});
    }
  })();

  /* ── 계좌 아코디언 ── */
  (() => {
    const side = (label, list) => `
      <div class="acc">
        <button class="acc__head" type="button">${label}</button>
        <div class="acc__body">${list.length ? list.map((a) => `
          <div class="acc__row">
            <div><div class="num">${a.bank} ${a.number}</div><div class="who">${a.holder}</div></div>
            <button class="acc__copy" type="button" data-num="${a.number}">복사</button>
          </div>`).join("") : `<p class="acc__empty">계좌 정보를 준비 중입니다</p>`}
        </div>
      </div>`;
    const box = $("#accounts");
    box.innerHTML = side("신랑측 계좌번호", W.accounts.groom) + side("신부측 계좌번호", W.accounts.bride);
    box.addEventListener("click", (e) => {
      const head = e.target.closest(".acc__head");
      if (head) head.parentElement.classList.toggle("is-open");
      const cp = e.target.closest(".acc__copy");
      if (cp) copy(cp.dataset.num);
    });
  })();

  /* ── 사진 편지함 (업로드) ── */
  (() => {
    const form = $("#uploadForm"), input = $("#uploadInput"), list = $("#uploadList"),
          submit = $("#uploadSubmit"), status = $("#uploadStatus"), drop = $(".upload__drop", form);
    let files = [];

    const render = () => {
      list.innerHTML = "";
      files.forEach((f) => {
        const li = document.createElement("li");
        li.dataset.state = "";
        const img = new Image(); img.src = URL.createObjectURL(f); img.onload = () => URL.revokeObjectURL(img.src);
        li.append(img); list.append(li); f._li = li;
      });
      submit.disabled = !files.length;
      status.textContent = files.length ? `${files.length}장 선택됨` : "";
    };
    const addFiles = (fl) => {
      files = files.concat([...fl].filter((f) => f.type.startsWith("image/"))).slice(0, 30);
      render();
    };
    input.addEventListener("change", () => { addFiles(input.files); input.value = ""; });
    ["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("is-over"); }));
    ["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("is-over"); }));
    drop.addEventListener("drop", (e) => addFiles(e.dataTransfer.files));

    // 캔버스로 리사이즈 → JPEG dataURL
    const shrink = (file) => new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const max = W.uploadMaxEdge || 2400;
        const r = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", W.uploadQuality || 0.88));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("decode")); };
      img.src = url;
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!W.uploadUrl) { toast("아직 업로드 주소가 설정되지 않았습니다"); return; }
      submit.disabled = true; input.disabled = true;
      const sender = $("#uploadSender").value.trim();
      let ok = 0;
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        f._li.dataset.state = "전송 중";
        status.textContent = `${i + 1} / ${files.length} 보내는 중…`;
        try {
          const dataUrl = await shrink(f);
          const res = await fetch(W.uploadUrl, {
            method: "POST",
            body: JSON.stringify({ token: W.uploadToken, name: f.name, sender, data: dataUrl.split(",")[1] }),
          });
          const json = await res.json();
          if (!json.ok) throw new Error(json.error || "fail");
          f._li.dataset.state = "완료"; ok++;
        } catch (err) {
          console.error(err);
          f._li.dataset.state = "실패";
        }
      }
      status.textContent = ok === files.length ? `${ok}장 모두 도착했습니다. 고맙습니다 ♥` : `${ok}장 도착, ${files.length - ok}장 실패 — 다시 시도해 주세요`;
      files = files.filter((f) => f._li.dataset.state !== "완료");
      input.disabled = false; submit.disabled = !files.length;
    });
  })();

  /* ── 공유 ── */
  (() => {
    $("#shareLink").addEventListener("click", async () => {
      if (navigator.share) {
        try { await navigator.share({ title: W.shareTitle, text: W.shareDesc, url: location.href }); return; } catch {}
      }
      copy(location.href);
    });
    if (!W.kakaoJsKey) return;
    const s = document.createElement("script");
    s.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js";
    s.onload = () => {
      Kakao.init(W.kakaoJsKey);
      const btn = $("#shareKakao"); btn.hidden = false;
      btn.addEventListener("click", () => Kakao.Share.sendDefault({
        objectType: "feed",
        content: {
          title: W.shareTitle, description: W.shareDesc,
          imageUrl: new URL("assets/illust/og.jpg", location.href).href,
          link: { mobileWebUrl: location.href, webUrl: location.href },
        },
        buttons: [{ title: "청첩장 보기", link: { mobileWebUrl: location.href, webUrl: location.href } }],
      }));
    };
    document.head.append(s);
  })();
})();
