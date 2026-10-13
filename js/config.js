// ─────────────────────────────────────────────
//  청첩장 내용 설정 — 이 파일만 고치면 내용이 바뀝니다
// ─────────────────────────────────────────────
window.WEDDING = {
  // 예식
  date: "2027-02-21T12:30:00+09:00",
  dateText: "2027년 2월 21일 일요일 낮 12시 30분",
  dateEn: "Sunday, February 21, 2027 · 12:30 PM",

  // 장소
  venue: {
    name: "엘블레스",
    hall: "",                               // 예: "4층 그랜드홀" — 확정되면 입력
    address: "서울 서초구 강남대로 213",       // TODO: 확인 필요
    tel: "",
    lat: 37.4842, lng: 127.0345,            // TODO: 확인 필요 (카카오맵 연동 시 사용)
    naverMapUrl: "https://map.naver.com/p/search/엘블레스%20웨딩",
    kakaoMapUrl: "https://map.kakao.com/?q=엘블레스%20웨딩",
    tmapUrl: "https://apis.openapi.sk.com/tmap/app/routes?name=엘블레스",
    guide: [
      { title: "지하철", text: "3호선·신분당선 양재역 하차" },   // TODO: 확정
      { title: "버스",   text: "양재역 정류장 하차" },
      { title: "주차",   text: "건물 내 주차 가능 (2시간 무료)" },
    ],
  },

  // 사람
  groom: { name: "이수완", en: "Soowan", father: "이상군", mother: "김옥경", relation: "장남", tel: "" },
  bride: { name: "이소정", en: "Sojeong", father: "이명호", mother: "김지영", relation: "장녀", tel: "" },

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

  // 사진 편지함 (Google Apps Script 웹앱 URL — 배포 후 붙여넣기)
  uploadUrl: "",
  uploadMaxEdge: 2400,   // 업로드 전 긴 변 리사이즈(px)
  uploadQuality: 0.88,

  // 공유
  shareTitle: "수완 ♥ 소정 결혼합니다",
  shareDesc: "2027년 2월 21일 일요일 12시 30분 · 엘블레스",
  kakaoJsKey: "",        // 카카오 개발자 JS 키 (있으면 카카오톡 공유 버튼 활성)
  kakaoMapKey: "",       // 카카오맵 JS 키 (있으면 지도 표시)
};
