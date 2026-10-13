// ─────────────────────────────────────────────
//  청첩장 내용 설정 — 이 파일만 고치면 내용이 바뀝니다
// ─────────────────────────────────────────────
window.WEDDING = {
  // 예식
  date: "2027-02-21T12:30:00+09:00",
  dateText: "2027년 2월 21일 일요일 낮 12시 30분",
  dateEn: "Sunday, February 21, 2027 · 12:30 PM",

  // 장소 — 출처: elbless.com/about/map, 다이렉트웨딩 (2026-10 확인)
  venue: {
    name: "엘블레스",
    hall: "다이아몬드홀 (스포타임 빌딩 LL층)",
    address: "서울 서초구 강남대로 213 LL층 엘블레스",
    addressShort: "서울 서초구 강남대로 213",
    tel: "02-526-0300",
    mapImage: "",                  // 직접 그린 약도 파일 (예: "assets/illust/map.png") — 있으면 지도 대신 표시
    lat: 37.4855, lng: 127.0335,   // 대략값 — 지도 키가 있으면 주소로 다시 좌표를 찾습니다
    naverMapUrl: "https://map.naver.com/p/search/엘블레스%20강남대로%20213",
    kakaoMapUrl: "https://map.kakao.com/?q=엘블레스%20강남대로%20213",
    tmapUrl: "https://apis.openapi.sk.com/tmap/app/routes?name=엘블레스&lon=127.0335&lat=37.4855",
    guide: [
      { title: "지하철", text: "3호선 · 신분당선 양재역 9번 출구와 바로 연결\n(스포타임 빌딩 지하, 출구에서 도보 1분)" },
      { title: "버스",   text: "양재역 또는 서초문화예술회관 하차\n간선 140 · 400 · 405 · 421 · 440 · 470 · 741\n지선 4432 · 4435 / 마을 서초09 · 18 · 20\n광역 9404 · 9408 · 9500 · 9711 · M4403 외" },
      { title: "자가용", text: "내비게이션에 \"엘블레스\" 또는 \"양재역 공영주차장\" 검색\n엘블레스 옆 양재역 공영주차장(강남대로 221) 이용 후 스포타임 빌딩으로 이동" },
      { title: "주차",   text: "내·외부 합산 900대 · 하객 2시간 무료\n이후 60분당 3,000원" },
    ],
  },

  // 사람
  groom: { name: "이수완", en: "Soowan", father: "이상군", mother: "김옥경", relation: "막내", tel: "010-2770-1457" },
  bride: { name: "이소정", en: "Sojeong", father: "이명호", mother: "김지영", relation: "장녀", tel: "010-5686-6551" },

  // 인사말 (줄바꿈은 \n)
  greeting: {
    title: "소중한 분들을 초대합니다",
    body:
      "서로의 편지가 되어 주기로 했습니다.\n" +
      "같은 방향으로 달려온 시간을 지나\n" +
      "이제 한 걸음을 함께 내딛으려 합니다.\n\n" +
      "저희의 시작을 지켜봐 주시면\n" +
      "더없는 기쁨으로 간직하겠습니다.",
  },

  // 마음 전하실 곳 — 비워두면 "준비 중"으로 표시
  accounts: {
    groom: [
      // { holder: "이수완", bank: "국민은행", number: "000000-00-000000" },
    ],
    bride: [
      // { holder: "이소정", bank: "신한은행", number: "000-000-000000" },
    ],
  },

  // 사진 편지함 (Google Apps Script 웹앱)
  uploadUrl: "https://script.google.com/macros/s/AKfycbxEIzpf7fm-oBocNZ5F_zg2Tb9kV0nwBj11Gl_tjG9YjpeG9o-9bDJOKEZ-jWMvpxc/exec",
  uploadToken: "ss-270221-letter",   // Code.gs 의 TOKEN 과 동일해야 함 (단순 봇 차단용)
  uploadMaxEdge: 2400,               // 업로드 전 긴 변 리사이즈(px)
  uploadQuality: 0.88,

  // 공유
  shareTitle: "수완 ♥ 소정 결혼합니다",
  shareDesc: "2027년 2월 21일 일요일 12시 30분 · 엘블레스",
  kakaoJsKey: "",        // 카카오 개발자 JS 키 (있으면 카카오톡 공유 버튼 활성)

  // 지도 — 둘 중 하나만 있으면 됨. 둘 다 있으면 네이버 우선
  kakaoMapKey: "",       // developers.kakao.com → 앱 → JavaScript 키 + 플랫폼 Web 도메인 등록
  naverMapClientId: "",  // ncloud.com → Maps → Dynamic Map → Client ID + 서비스 URL 등록
};
