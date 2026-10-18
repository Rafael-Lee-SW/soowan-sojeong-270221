// ─────────────────────────────────────────────
//  청첩장 내용 설정 — 이 파일만 고치면 내용이 바뀝니다
// ─────────────────────────────────────────────
window.WEDDING = {
  // 예식
  date: "2027-02-21T12:30:00+09:00",
  dateText: "2027년 2월 21일 (일) 오후 12시 30분",
  dateEn: "Feb. 21st, 2027 · 12:30 PM",

  // 장소 — 출처: elbless.com/about/map, 다이렉트웨딩 (2026-10 확인)
  venue: {
    name: "엘블레스",
    hall: "다이아몬드홀 (스포타임 지하 1층)",
    address: "서울 서초구 강남대로 213, 스포타임 지하 1층",
    addressShort: "서울 서초구 강남대로 213",
    tel: "02-526-0300",
    mapImage: "assets/illust/map.webp",   // 예식장 제공 약도 (원본: assets/source/엘블레스 약도(예식장 제공).jpg, 아래 안내 블록은 잘라냄)
    lat: 37.4855, lng: 127.0335,   // 대략값 — 지도 키가 있으면 주소로 다시 좌표를 찾습니다
    naverMapUrl: "https://map.naver.com/p/search/엘블레스%20강남대로%20213",
    kakaoMapUrl: "https://map.kakao.com/?q=엘블레스%20강남대로%20213",
    tmapUrl: "tmap://search?name=엘블레스",   // 티맵은 웹 주소가 없어 앱 스킴으로 연다 (PC 에서는 안내만, 앱 없는 휴대폰은 스토어로)
    guide: [   // 엘블레스 공식 안내문 기준 (2026-10)
      { title: "지하철", text: "3호선 · 신분당선 양재역 9번 출구 바로 연결\n(스포타임 건물 지하 1층에 엘블레스가 있습니다)" },
      { title: "자가용", text: "엘블레스 옆 양재역 공영 주차장 이용 (서초구 강남대로 221)\n주차 후 옆 건물 스포타임으로 이동하시면 됩니다" },
      { title: "주차", text: "내·외부 합산 900대 · 하객 2시간 무료\n이후 60분당 3,000원" },
      { title: "버스", text: "양재역 · 서초문화예술회관 하차\n지선 0411 · 4432 · 4435\n간선 140 · 341 · 400 · 405 · 421 · 440 · 441 · 452 · 470 · 542 · 741\n광역 9404 · 9408 · 9409 · 9500 · 9501 · 9711 · 9802 · M4403 · M4434 · M4448 · M4449 · M5422 · M5438 · M5443 · M6410 · M6450\n마을 서초09 · 서초18 · 서초18-1 · 서초20\n일반 6 · 11-3 · 917\n직행 1006 · 1311 · 3000 · 3002 · 3003 · 3007 · 3008 · 3030 · 3100 · 3101 · 3102 · 3201 · 3800 · 5200 · 5300 · 9202 · 9400 · 9700 · G1003 · G3900 · G8157 · G9633" },
    ],
  },

  // 사람
  // relation: 같은 성별 형제 중 순서 (장남/차남…, 장녀/차녀…). first: 부모 란 뒤에 붙는 이름(성 제외)
  groom: { name: "이수완", first: "수완", en: "Soowan", father: "이상군", mother: "김옥경", relation: "차남", tel: "010-2770-1457" },
  bride: { name: "이소정", first: "소정", en: "Sojeong", father: "이명호", mother: "김지영", relation: "장녀", tel: "010-5686-6551" },

  // 인사말 (줄바꿈은 \n)
  greeting: {
    title: "소중한 분들을 초대합니다",
    body:
      "흩어져 흐르던 시간들이 마주쳐\n" +
      "맑고 단단한 결정이 되었습니다.\n" +
      "서로에게 부드럽게 녹아들며\n" +
      "세상은 한 층 더 포근해졌습니다.\n\n" +
      "거창한 약속 대신 매일의 온기로\n" +
      "흔들림 없이 걷겠습니다.\n" +
      "저희가 빚어낼 새로운 시작에\n" +
      "환한 응원을 더해 주세요.",
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
  // 원본 그대로 전송 (리사이즈 없음). 아래 한도는 안내용이고 실제 한도는 Code.gs 가 강제함 — 두 곳을 같이 맞출 것
  uploadImageMax: 20 * 1024 * 1024,   // 사진 20MB
  uploadVideoMax: 1024 * 1024 * 1024, // 동영상 1GB

  // 공유
  shareTitle: "수완 ♥ 소정 결혼합니다",
  shareDesc: "2027년 2월 21일 일요일 12시 30분 · 엘블레스",
  kakaoJsKey: "",        // 카카오 개발자 JS 키 (있으면 카카오톡 공유 버튼 활성). 플랫폼 Web 도메인 등록 필수
  kakaoSdkIntegrity: "", // developers.kakao.com 의 SDK 2.7.4 integrity(sha384) 값 — 넣으면 변조 방지

  // 지도 — 둘 중 하나만 있으면 됨. 둘 다 있으면 네이버 우선
  kakaoMapKey: "",       // developers.kakao.com → 앱 → JavaScript 키 + 플랫폼 Web 도메인 등록
  naverMapClientId: "",  // ncloud.com → Maps → Dynamic Map → Client ID + 서비스 URL 등록
};
