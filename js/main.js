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

  /* ── 테마 (검토용) ── */
  const applyTheme = (t) => {
    document.documentElement.dataset.theme = t;
    $$("#themeSwitch button").forEach((b) => b.classList.toggle("is-active", b.dataset.theme === t));
    try { localStorage.setItem("theme", t); } catch {}
  };
  const qTheme = new URLSearchParams(location.search).get("theme");
  let saved = null; try { saved = localStorage.getItem("theme"); } catch {}
  applyTheme(qTheme || saved || "cream");
  $$("#themeSwitch button").forEach((b) => b.addEventListener("click", () => applyTheme(b.dataset.theme)));

  /* ── 봉투 인트로 ── */
  const env = $("#envelope");
  const openEnvelope = () => {
    if (env.classList.contains("is-open")) return;
    env.classList.add("is-open");
    setTimeout(() => { env.classList.add("is-gone"); document.body.style.overflow = ""; }, 1300);
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
    const grid = $("#galleryGrid");
    const photos = window.PHOTOS || [];
    if (!photos.length) {
      grid.innerHTML = Array.from({ length: 9 }, (_, i) =>
        `<div class="gallery__ph${i === 0 ? " is-wide" : ""}">${i === 0 ? "photos coming soon" : ""}</div>`).join("");
      return;
    }
    grid.innerHTML = photos.map((p, i) => {
      const wide = p.w && p.h && p.w / p.h > 1.6;
      return `<figure class="gallery__item${wide ? " is-wide" : ""}" data-i="${i}"><img src="${p.thumb || p.src}" alt="" loading="lazy"></figure>`;
    }).join("");

    const lb = $("#lightbox"), img = $(".lightbox__img", lb), count = $(".lightbox__count", lb);
    let cur = 0;
    const show = (i) => {
      cur = (i + photos.length) % photos.length;
      img.src = photos[cur].src;
      count.textContent = `${cur + 1} / ${photos.length}`;
    };
    const open = (i) => { show(i); lb.hidden = false; document.body.style.overflow = "hidden"; };
    const close = () => { lb.hidden = true; document.body.style.overflow = ""; };
    grid.addEventListener("click", (e) => { const f = e.target.closest(".gallery__item"); if (f) open(+f.dataset.i); });
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
    if (!W.kakaoMapKey) return;
    const s = document.createElement("script");
    s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${W.kakaoMapKey}&autoload=false`;
    s.onload = () => kakao.maps.load(() => {
      const el = $("#map"); el.innerHTML = "";
      const pos = new kakao.maps.LatLng(W.venue.lat, W.venue.lng);
      const map = new kakao.maps.Map(el, { center: pos, level: 3, draggable: false });
      new kakao.maps.Marker({ map, position: pos });
    });
    document.head.append(s);
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
            body: JSON.stringify({ name: f.name, sender, data: dataUrl.split(",")[1] }),
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
          imageUrl: new URL("assets/illust/running@800.jpg", location.href).href,
          link: { mobileWebUrl: location.href, webUrl: location.href },
        },
        buttons: [{ title: "청첩장 보기", link: { mobileWebUrl: location.href, webUrl: location.href } }],
      }));
    };
    document.head.append(s);
  })();
})();
