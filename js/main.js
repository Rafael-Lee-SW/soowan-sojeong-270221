(() => {
  document.documentElement.classList.replace("no-js", "js");
  const W = window.WEDDING;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const get = (path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), W);
  // 한 섹션이 깨져도 나머지는 동작하도록
  const safe = (name, fn) => { try { fn(); } catch (e) { console.error(`[${name}]`, e); } };

  /* ── 토스트 ── */
  let toastTimer;
  const toast = (msg) => {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("is-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("is-show"), 2000);
  };

  const copy = async (text) => {
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; }
    catch {
      const ta = Object.assign(document.createElement("textarea"), { value: text, readOnly: true, style: "position:fixed;opacity:0" });
      document.body.append(ta); ta.select(); ta.setSelectionRange(0, text.length);
      try { ok = document.execCommand("copy"); } catch {}
      ta.remove();
    }
    toast(ok ? "복사되었습니다" : "복사에 실패했습니다 — 길게 눌러 복사해 주세요");
  };

  /* ── iOS 포함 스크롤 잠금 ── */
  let lockY = 0;
  const lockScroll = () => { lockY = window.scrollY; document.body.style.cssText = `position:fixed;top:-${lockY}px;left:0;right:0;overflow:hidden`; };
  const unlockScroll = () => { document.body.style.cssText = ""; window.scrollTo(0, lockY); };

  /* ── config → DOM 바인딩 ── */
  safe("bind", () => {
    $$("[data-bind]").forEach((el) => { const v = get(el.dataset.bind); if (v != null) el.textContent = v; });
    $$("[data-href]").forEach((el) => { const v = get(el.dataset.href); if (v) el.href = v; else el.hidden = true; });
    // 티맵: tmap:// 스킴은 휴대폰 앱에서만 열린다. PC 면 안내, 앱이 없어 1.5초 안에 화면이 안 바뀌면 스토어로
    $$("[data-href='venue.tmapUrl']").forEach((el) => {
      el.removeAttribute("target");
      el.addEventListener("click", (e) => {
        const ua = navigator.userAgent, ios = /iPhone|iPad|iPod/i.test(ua), android = /Android/i.test(ua);
        if (!ios && !android) { e.preventDefault(); toast("티맵은 휴대폰에서 앱으로 열립니다 — 네이버지도나 카카오맵을 이용해 주세요"); return; }
        const store = ios ? "https://apps.apple.com/kr/app/id431589174" : "https://play.google.com/store/apps/details?id=com.skt.tmap.ku";
        setTimeout(() => { if (document.visibilityState === "visible") location.href = store; }, 1500);
      });
    });
    $$("[data-tel]").forEach((el) => {
      const tel = get(el.dataset.tel);
      if (tel) { el.href = `tel:${tel}`; el.setAttribute("aria-label", `${el.textContent.trim()}에게 전화`); }
      else el.setAttribute("aria-disabled", "true");
    });
    $$("[data-action=copy]").forEach((el) => el.addEventListener("click", () => copy(get(el.dataset.copy))));
    $$("[data-action=toggle]").forEach((el) => {
      const t = $(el.dataset.target);
      el.setAttribute("aria-expanded", "false"); el.setAttribute("aria-controls", t.id);
      el.addEventListener("click", () => { t.hidden = !t.hidden; el.setAttribute("aria-expanded", String(!t.hidden)); });
    });
  });

  /* ── 테마: 화이트 확정 (?theme=cream 으로 비교만 가능). 검토 때 기기에 저장된 선택은 지운다 ── */
  const qs = new URLSearchParams(location.search);
  try { localStorage.removeItem("theme"); } catch {}
  if (qs.get("theme") === "cream") document.documentElement.dataset.theme = "cream";

  /* ── 연락하기: 신랑·신부 + 부모님 번호 (번호 = 복사, ☎ = 전화) ── */
  safe("contacts", () => {
    const esc = (v) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    $$("#contactPanel [data-side]").forEach((col) => {
      const side = col.dataset.side, p = W[side];
      const rows = [[side === "groom" ? "신랑" : "신부", p.name, p.tel], ["아버지", p.father, p.fatherTel], ["어머니", p.mother, p.motherTel]].filter((r) => r[1] && r[2]);
      col.innerHTML = `<p class="contact__who">${side === "groom" ? "신랑측" : "신부측"}</p><div class="contact__list">${rows.map(([role, name, tel]) => `
        <div class="contact__row">
          <span class="contact__name"><span class="contact__role">${role}</span>${esc(name)}</span>
          <button class="contact__num" type="button" data-copy-text="${esc(tel)}" aria-label="${esc(name)} 전화번호 복사">${esc(tel)}</button>
          <a class="contact__call" href="tel:${esc(tel)}" aria-label="${esc(name)}에게 전화">☎</a>
        </div>`).join("")}</div>`;
    });
    $("#contactPanel").addEventListener("click", (e) => { const b = e.target.closest("[data-copy-text]"); if (b) copy(b.dataset.copyText); });
  });

  /* ── 캘린더에 추가: Google 은 링크, iPhone 은 .ics 파일(config.icsFile) ── */
  safe("calendarAdd", () => {
    const start = new Date(W.date), end = new Date(start.getTime() + 90 * 60000);
    const z = (d) => d.toISOString().replace(/[-:]|\.\d{3}/g, "");
    const g = new URL("https://calendar.google.com/calendar/render");
    g.searchParams.set("action", "TEMPLATE");
    g.searchParams.set("text", `${W.groom.name} ♥ ${W.bride.name} 결혼식`);
    g.searchParams.set("dates", `${z(start)}/${z(end)}`);
    g.searchParams.set("ctz", "Asia/Seoul");
    g.searchParams.set("location", `${W.venue.name} ${W.venue.hall} (${W.venue.address})`);
    g.searchParams.set("details", `모바일 청첩장 ${location.origin}${location.pathname}`);
    $("#calGoogle").href = g.href;
  });

  /* ── 참석 의사 (RSVP): 이름 + 참석 여부만. Apps Script 가 구글 시트에 기록 ── */
  safe("rsvp", () => {
    const form = $("#rsvpForm"), nameEl = $("#rsvpName"), btn = $("#rsvpSubmit"), status = $("#rsvpStatus");
    const KEY = "rsvp-270221", label = (a) => (a === "yes" ? "참석" : "불참");
    let saved = null; try { saved = JSON.parse(localStorage.getItem(KEY) || "null"); } catch {}
    if (saved && saved.name) {
      nameEl.value = saved.name;
      const r = $(`input[name="attend"][value="${saved.attend}"]`, form); if (r) r.checked = true;
      status.textContent = `${saved.name}님의 ${label(saved.attend)} 의사가 전달되어 있습니다. 바뀌면 다시 보내 주세요.`;
      btn.textContent = "다시 전달하기";
    }
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = nameEl.value.trim(), attend = ($('input[name="attend"]:checked', form) || {}).value;
      if (!name) { toast("성함을 입력해 주세요"); nameEl.focus(); return; }
      if (!attend) { toast("참석 여부를 선택해 주세요"); return; }
      if (!W.uploadUrl) { toast("아직 전달 주소가 설정되지 않았습니다"); return; }
      btn.disabled = true; status.textContent = "전달하는 중…";
      try {
        const res = await fetch(W.uploadUrl, { method: "POST", body: JSON.stringify({ action: "rsvp", token: W.uploadToken, origin: location.origin, name, attend }) });
        const json = await res.json();
        if (!json.ok) throw Object.assign(new Error(json.error || "error"), { code: json.error });
        try { localStorage.setItem(KEY, JSON.stringify({ name, attend })); } catch {}
        status.textContent = attend === "yes" ? `${name}님, 전달되었습니다. 그날 뵙겠습니다 ♥` : `${name}님, 전달되었습니다. 마음만으로도 고맙습니다 ♥`;
        btn.textContent = "다시 전달하기";
      } catch (err) {
        console.error(err);
        status.textContent = err.code === "closed" ? "참석 의사 접수가 마감되었습니다" : "전달에 실패했습니다. 잠시 후 다시 시도해 주세요";
      }
      btn.disabled = false;
    });
  });

  /* ── 봉투 인트로 ── */
  safe("envelope", () => {
    const env = $("#envelope"), img = $("img", env);
    const openEnvelope = () => {
      if (env.classList.contains("is-open")) return;
      env.classList.add("is-open");
      setTimeout(() => { env.classList.add("is-gone"); unlockScroll(); }, 700);
    };
    lockScroll();
    env.addEventListener("click", openEnvelope);
    env.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
    // 그림이 뜬 뒤 2.4초 후 자동 오픈 (느린 망에서도 봉투를 보고 넘어가도록), 최대 6초
    const arm = () => setTimeout(openEnvelope, 2400);
    if (img.complete) arm(); else { img.addEventListener("load", arm, { once: true }); img.addEventListener("error", arm, { once: true }); }
    setTimeout(openEnvelope, 6000);
  });

  /* ── 스크롤 등장 ── */
  safe("reveal", () => {
    const all = $$(".reveal");
    if (qs.has("reveal") || !("IntersectionObserver" in window)) { all.forEach((el) => el.classList.add("is-in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    all.forEach((el) => io.observe(el));
  });

  /* ── 달력 (로컬 달력 날짜로 — 해외 브라우저에서도 21일) ── */
  safe("calendar", () => {
    const [y, mo, d] = W.date.slice(0, 10).split("-").map(Number);
    const m = mo - 1;
    const grid = $("#calendarGrid");
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
    const diff = Math.round((new Date(y, m, d) - today) / 864e5);
    const el = $("#dday");
    if (diff > 0) el.innerHTML = `${W.groom.name} ♥ ${W.bride.name}의 결혼식이 <b>${diff}</b>일 남았습니다`;
    else if (diff === 0) el.innerHTML = `오늘, 두 사람이 결혼합니다 <b>D-day</b>`;
    else el.innerHTML = `결혼한 지 <b>${-diff}</b>일이 되었습니다`;
  });

  /* ── 갤러리 + 라이트박스 ── */
  safe("gallery", () => {
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
        return `<button type="button" class="studio__item${full ? " is-full" : ""}" data-i="${i}" aria-label="사진 ${i + 1} 크게 보기"><img src="${p.thumb || p.src}" alt="웨딩 사진 ${i + 1}" loading="lazy"></button>`;
      }).join("");
    }
    if (film.length) {
      filmBox.hidden = false;
      strip.innerHTML = film.map((p, i) =>
        `<button type="button" class="polaroid" data-i="${studio.length + i}" aria-label="필름 사진 ${i + 1} 크게 보기"><img src="${p.src}" alt="필름 사진 ${i + 1}" loading="lazy"><span class="polaroid__cap">${p.caption || `no. ${i + 1}`}</span></button>`).join("");
      // "옆으로 넘겨보세요" 는 실제로 넘길 게 있을 때만 (데스크톱에서 다 보이면 숨김)
      const hint = $(".film__hint", filmBox);
      const syncHint = () => { hint.hidden = strip.scrollWidth <= strip.clientWidth + 4; };
      syncHint(); addEventListener("resize", syncHint);
    }
    if (!photos.length) return;

    const lb = $("#lightbox"), img = $(".lightbox__img", lb), count = $(".lightbox__count", lb), closeBtn = $(".lightbox__close", lb);
    let cur = 0, lastFocus = null;
    const preload = (i) => { const p = photos[(i + photos.length) % photos.length]; if (p) new Image().src = p.src; };
    const show = (i) => {
      cur = (i + photos.length) % photos.length;
      img.src = photos[cur].src; img.alt = `사진 ${cur + 1} / ${photos.length}`;
      count.textContent = `${cur + 1} / ${photos.length}`;
      preload(cur + 1); preload(cur - 1);
    };
    const open = (i) => { lastFocus = document.activeElement; show(i); lb.hidden = false; lockScroll(); $("main").inert = true; closeBtn.focus(); };
    const close = () => { lb.hidden = true; unlockScroll(); $("main").inert = false; lastFocus && lastFocus.focus(); };
    $("#gallery").addEventListener("click", (e) => { const f = e.target.closest("[data-i]"); if (f) open(+f.dataset.i); });
    closeBtn.addEventListener("click", close);
    $(".lightbox__nav--prev", lb).addEventListener("click", () => show(cur - 1));
    $(".lightbox__nav--next", lb).addEventListener("click", () => show(cur + 1));
    lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
    document.addEventListener("keydown", (e) => {
      if (lb.hidden) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") show(cur - 1);
      else if (e.key === "ArrowRight") show(cur + 1);
      else if (e.key === "Tab") {   // 포커스를 라이트박스 안에서 순환
        const f = $$("button", lb), a = f.indexOf(document.activeElement);
        e.preventDefault(); f[(a + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    });
    let sx = 0, sy = 0;
    lb.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    lb.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
    lb.addEventListener("touchend", (e) => {
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) show(cur + (dx < 0 ? 1 : -1));
    });
  });

  /* ── 오시는 길 ── */
  safe("location", () => {
    // " · " 구분점은 앞 항목에 붙여 줄 맨 앞에 오지 않게, "서초18-1" 같은 번호·짧은 괄호 "(서초구 강남대로 221)" 는 중간에서 끊기지 않게
    const tidy = (t) => t.replace(/ · /g, "\u00a0· ").replace(/(\([^()\n]{1,16}\)|\S+-\S+)/g, '<span class="nowrap">$1</span>');
    $("#locationGuide").innerHTML = (W.venue.guide || []).map((g) => `<div><dt>${g.title}</dt><dd>${tidy(g.text)}</dd></div>`).join("");
    const el = $("#map"), v = W.venue;
    // 직접 그린 약도가 있으면 그것을 최우선으로
    if (v.mapImage) {
      // loading="lazy" 를 주면 안 된다: 아직 화면에 넣지 않은 이미지는 사파리 등이 로드를 시작하지 않아 "준비 중" 이 그대로 남는다
      const img = new Image(); img.alt = "약도"; img.decoding = "async";
      img.onload = () => { el.innerHTML = ""; el.classList.add("has-image"); el.append(img); };
      img.onerror = () => console.error("[map] 약도 이미지를 불러오지 못했습니다:", v.mapImage);
      img.src = v.mapImage;
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
      }).catch((e) => console.error(e));
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
      })).catch((e) => console.error(e));
    }
  });

  /* ── 계좌 아코디언 ── */
  safe("accounts", () => {
    const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    const side = (label, list, id) => `
      <div class="acc">
        <button class="acc__head" type="button" aria-expanded="false" aria-controls="${id}">${label}</button>
        <div class="acc__body" id="${id}">${list.length ? list.map((a) => `
          <div class="acc__row">
            <div><div class="num">${esc(a.bank)} ${esc(a.number)}</div><div class="who">${esc(a.holder)}</div></div>
            <button class="acc__copy" type="button" data-num="${esc(a.number)}" aria-label="${esc(a.holder)} 계좌번호 복사">복사</button>
          </div>`).join("") : `<p class="acc__empty">계좌 정보를 준비 중입니다</p>`}
        </div>
      </div>`;
    const box = $("#accounts");
    box.innerHTML = side("신랑측 계좌번호", W.accounts.groom, "accGroom") + side("신부측 계좌번호", W.accounts.bride, "accBride");
    box.addEventListener("click", (e) => {
      const head = e.target.closest(".acc__head");
      if (head) { const open = head.parentElement.classList.toggle("is-open"); head.setAttribute("aria-expanded", String(open)); }
      const cp = e.target.closest(".acc__copy");
      if (cp) copy(cp.dataset.num);
    });
  });

  /* ── 사진·동영상 편지함 (업로드) ──
     1) Apps Script 에 파일 정보만 보내 Drive 업로드 세션 URL 을 받고
     2) 그 URL 로 Google 서버에 직접 8MB 씩 조각 전송 (Apps Script 를 거치지 않아 1GB 동영상도 가능) */
  safe("upload", () => {
    const form = $("#uploadForm"), input = $("#uploadInput"), list = $("#uploadList"),
          submit = $("#uploadSubmit"), status = $("#uploadStatus"), drop = $(".upload__drop", form);
    const MAX_FILES = 30, PARALLEL = 2, CHUNK = 8 * 1024 * 1024;   // 조각은 256KB 의 배수여야 함
    const IMAGE_MAX = W.uploadImageMax || 20 * 1024 * 1024, VIDEO_MAX = W.uploadVideoMax || 1024 * 1024 * 1024;
    let files = [], uploading = false;
    const mb = (n) => `${(n / 1048576).toFixed(n < 10485760 ? 1 : 0)}MB`;
    const kind = (f) => (f.type.startsWith("video/") || /\.(mp4|mov|m4v|webm|3gp)$/i.test(f.name)) ? "video" : "image";

    const render = () => {
      list.innerHTML = "";
      files.forEach((f) => {
        const li = document.createElement("li");
        li.dataset.state = f._state || "";
        if (kind(f) === "video") {
          const v = document.createElement("video"); v.muted = true; v.playsInline = true; v.preload = "metadata";
          const url = URL.createObjectURL(f); v.src = url;
          v.onloadeddata = () => { try { v.currentTime = 0.1; } catch {} };
          v.onerror = () => { URL.revokeObjectURL(url); li.classList.add("is-video-ph"); };
          li.append(v); li.classList.add("is-video");
        } else {
          const img = new Image(); img.alt = "";
          const url = URL.createObjectURL(f); img.src = url;
          img.onload = () => URL.revokeObjectURL(url);
          img.onerror = () => { URL.revokeObjectURL(url); li.dataset.state = "미리보기 불가"; };
          li.append(img);
        }
        list.append(li); f._li = li;
      });
      submit.disabled = !files.length;
      const total = files.reduce((s, f) => s + f.size, 0);
      status.textContent = files.length ? `${files.length}개 선택됨 · ${mb(total)}` : "";
    };
    const key = (f) => `${f.name}|${f.size}|${f.lastModified}`;
    const addFiles = (fl) => {
      const picked = [...fl];
      const media = picked.filter((f) => f.type.startsWith("image/") || f.type.startsWith("video/") || /\.(jpe?g|png|webp|heic|heif|gif|mp4|mov|m4v|webm|3gp)$/i.test(f.name));
      const sized = media.filter((f) => f.size <= (kind(f) === "video" ? VIDEO_MAX : IMAGE_MAX));
      const seen = new Set(files.map(key));
      const fresh = sized.filter((f) => !seen.has(key(f)));
      const room = MAX_FILES - files.length;
      files = files.concat(fresh.slice(0, room));
      const notMedia = picked.length - media.length, tooBig = media.length - sized.length, over = Math.max(0, fresh.length - room);
      if (notMedia) toast(`${notMedia}개는 사진·동영상이 아니라 제외했습니다`);
      else if (tooBig) toast(`${tooBig}개는 너무 커서 제외했습니다 (사진 ${mb(IMAGE_MAX)} · 동영상 ${mb(VIDEO_MAX)} 까지)`);
      else if (over) toast(`한 번에 ${MAX_FILES}개까지 보낼 수 있어요`);
      render();
    };
    input.addEventListener("change", () => { addFiles(input.files); input.value = ""; });
    ["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("is-over"); }));
    ["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("is-over"); }));
    drop.addEventListener("drop", (e) => addFiles(e.dataTransfer.files));
    window.addEventListener("beforeunload", (e) => { if (uploading) { e.preventDefault(); e.returnValue = ""; } });

    // 1) 세션 열기
    const openSession = async (f) => {
      const res = await fetch(W.uploadUrl, {
        method: "POST",
        body: JSON.stringify({ token: W.uploadToken, origin: location.origin, name: f.name, size: f.size, type: f.type || (kind(f) === "video" ? "video/mp4" : "image/jpeg"), sender: f._sender }),
      });
      const json = await res.json();
      if (!json.ok) throw Object.assign(new Error(json.error || "init"), { code: json.error });
      return json.url;
    };
    // 2) 조각 전송 (308 = 계속, 200/201 = 완료). 실패한 조각은 서버가 받은 위치부터 다시
    const putChunks = async (f, url, onProgress) => {
      let start = 0, retries = 0;
      while (start < f.size) {
        const end = Math.min(start + CHUNK, f.size);
        let res;
        try {
          res = await fetch(url, { method: "PUT", headers: { "Content-Range": `bytes ${start}-${end - 1}/${f.size}` }, body: f.slice(start, end) });
        } catch (e) { res = null; }
        if (res && (res.status === 200 || res.status === 201)) { onProgress(1); return; }
        if (res && res.status === 308) {
          const r = res.headers.get("Range");                       // "bytes=0-8388607"
          start = r ? Number(r.split("-")[1]) + 1 : end; retries = 0;
          onProgress(start / f.size); continue;
        }
        if (++retries > 4) throw new Error("chunk " + (res ? res.status : "network"));
        await new Promise((r) => setTimeout(r, 1500 * retries));
        // 서버가 어디까지 받았는지 물어보고 이어서
        try {
          const q = await fetch(url, { method: "PUT", headers: { "Content-Range": `bytes */${f.size}` }, body: new Blob([]) });
          if (q.status === 308) { const r = q.headers.get("Range"); start = r ? Number(r.split("-")[1]) + 1 : start; }
          else if (q.status === 200 || q.status === 201) { onProgress(1); return; }
        } catch {}
      }
    };

    const send = async (f) => {
      f._state = "준비 중"; f._li.dataset.state = f._state;
      try {
        const url = await openSession(f);
        await putChunks(f, url, (p) => { f._li.dataset.state = p >= 1 ? "완료" : `${Math.floor(p * 100)}%`; });
        f._state = "완료";
      } catch (err) {
        console.error(err);
        f._state = err.code === "limit" ? "한도 초과" : err.code === "closed" ? "접수 마감" : err.code === "too large" ? "용량 초과" : "실패";
      }
      f._li.dataset.state = f._state;
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!W.uploadUrl) { toast("아직 업로드 주소가 설정되지 않았습니다"); return; }
      const queue = files.filter((f) => f._state !== "완료");
      if (!queue.length) return;
      uploading = true; submit.disabled = true; input.disabled = true;
      const sender = $("#uploadSender").value.trim();
      queue.forEach((f) => { f._sender = sender; });
      let done = 0, idx = 0;
      const worker = async () => {
        while (idx < queue.length) {
          const f = queue[idx++];
          await send(f);
          done++; status.textContent = `${done} / ${queue.length} 보내는 중…`;
        }
      };
      await Promise.all(Array.from({ length: Math.min(PARALLEL, queue.length) }, worker));
      uploading = false;
      const ok = queue.filter((f) => f._state === "완료").length;
      const bad = queue.length - ok;
      const closed = queue.some((f) => f._state === "접수 마감");
      status.textContent = ok === queue.length ? `${ok}개 모두 도착했습니다. 고맙습니다 ♥`
        : closed ? "사진 편지함 접수가 마감되었습니다"
        : `${ok}개 도착, ${bad}개 실패 — 다시 보내기를 눌러 주세요`;
      files = files.filter((f) => f._state !== "완료");
      input.disabled = false; submit.disabled = !files.length;
      submit.textContent = bad ? "다시 보내기" : "보내기";
    });
  });

  /* ── 공유 ── */
  safe("share", () => {
    const btn = $("#shareLink");
    if (navigator.share) btn.textContent = "공유하기";
    btn.addEventListener("click", async () => {
      if (navigator.share) {
        try { await navigator.share({ title: W.shareTitle, text: W.shareDesc, url: location.href }); return; }
        catch (e) { if (e && e.name === "AbortError") return; }
      }
      copy(location.href);
    });
    if (!W.kakaoJsKey) return;
    const s = document.createElement("script");
    s.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js";
    s.crossOrigin = "anonymous";
    if (W.kakaoSdkIntegrity) s.integrity = W.kakaoSdkIntegrity;   // developers.kakao.com 문서의 sha384 값
    s.onload = () => {
      Kakao.init(W.kakaoJsKey);
      const k = $("#shareKakao"); k.hidden = false;
      k.addEventListener("click", () => Kakao.Share.sendDefault({
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
  });
})();
