# 수완 ♥ 소정 모바일 청첩장

순수 HTML/CSS/JS. 빌드 없음. `main` 에 push 하면 GitHub Pages 로 바로 배포된다.

## 구조

```
index.html          페이지 전체 (섹션 8개)
css/style.css       스타일 — :root[data-theme] 에 크림/화이트 테마 토큰
js/config.js        ★ 예식 정보·계좌·업로드 URL 등 내용은 전부 여기
js/photos.js        갤러리 목록 (자동 생성)
js/main.js          동작 (봉투 인트로, 달력, 갤러리, 업로드, 공유)
assets/illust/      그림 (웹용 리사이즈본)
assets/photos/      갤러리 사진 (웹용 리사이즈본, 자동 생성)
originals/          DSLR 원본 넣는 곳 (git 제외)
apps-script/Code.gs 사진 편지함 서버 (Google Apps Script 에 붙여넣기)
tools/resize-photos.py  originals → assets/photos + photos.js
```

## 로컬에서 보기

```
python -m http.server 8000
```
→ http://localhost:8000  (file:// 로 열면 fetch/폰트가 막힐 수 있음)

## 사진 넣기

1. `originals/` 에 원본을 넣는다 (파일명 순서 = 갤러리 순서)
2. `python tools/resize-photos.py`
3. commit & push

## 나중에 반영할 것 (실물 청첩장 기준)

실물 청첩장(`청첩장_실물 (1).jpg`, `(2).jpg`)에 쓰인 **약도**와 **손으로 수정된 그림**은 아직 웹에 반영하지 않았다.
받으면 아래 순서로 넣는다.

### 1) 약도
1. 약도 파일을 `assets/illust/map.png` (또는 .webp/.jpg) 로 저장 — 4:3 비율이 지도 칸에 가장 잘 맞음. 흰 배경이면 `python tools/cut-illust.py <원본> map 1200` 으로 투명화 가능
2. `js/config.js` → `venue.mapImage: "assets/illust/map.png"`
3. 끝. (`index.html` 의 "약도 준비 중" 플레이스홀더는 자동으로 교체됨)

### 2) 손으로 수정된 그림으로 교체
현재 쓰는 파일과 위치 (같은 파일명으로 덮어쓰면 코드 수정 없이 교체됨):

| 그림 | 파일 | 쓰이는 곳 |
|---|---|---|
| 달리는 신랑신부 (실물 앞면, 흑백 선화 + 반짝이) | `assets/illust/running.{png,webp}`, `running@800.*` | 히어로 (`index.html` `.hero__art`) |
| 수레 신랑신부 | `assets/illust/wheelbarrow.*`, `wheelbarrow@800.*` | 사진 편지함 (`.letterbox__art`) |
| 인사하는 신랑신부 | `assets/illust/bow.*`, `bow@600.*` | 푸터 (`.footer__bow`) |
| 봉투 | `assets/illust/envelope.*`, `envelope@600.*` | 인트로 (`.envelope__paper`) |
| 우편가방 | `assets/illust/mailbag@300.*` | 업로드 버튼 (`.upload__icon`) |
| 꽃 덩굴 (실물 뒷면 세로 장식) | 아직 없음 → `assets/illust/vine.*` 로 넣고 `.section__title` 옆이나 섹션 구분용으로 사용 | — |

교체 절차: 원본을 `assets/source/` 에 두고 `python tools/cut-illust.py "assets/source/파일.png" running 1400`
→ 배경 제거·크롭·PNG/WebP 생성. 신랑신부가 그림 중앙에 오도록 자동 패딩됨. `@800` 등 축소본도 함께 만들려면 폭을 바꿔 한 번 더 실행.
교체 후 `assets/illust/og.jpg`(카카오톡 미리보기)도 다시 만들고 developers.kakao.com/tool/clear/og 에서 캐시 삭제.

### 3) 실물에서 가져온 문구·폰트 (이미 반영됨)
- 인사말: 실물 뒷면 문구 그대로 (`config.js` `greeting.body`)
- 영문 손글씨: Caveat (`--font-hand`), 한글 손글씨: Nanum Pen Script (`--font-hand-ko`) — `css/style.css` 상단 토큰
- "Kindly join us for the wedding of" / "Feb. 21st, 2027 · 12:30 PM" / "차남 수완 · 장녀 소정"

## 그림 추가하기

GPT 등에서 받은 원본은 `assets/source/` 에 두고, 배경 제거·분할은 `tools/cut-illust.py` 로 한다(흰 배경 기준).

## 사진·동영상 편지함 연결

`apps-script/Code.gs` 상단 주석 참고. 권한 범위는 코드에서 자동 감지되므로 `appsscript.json` 은 참고용(선택).
배포된 웹앱 URL 을 `js/config.js` 의 `uploadUrl` 에 넣는다.

전송 방식: 브라우저 → Apps Script(세션만 발급) → 브라우저가 Google 서버로 직접 8MB 씩 조각 전송.
한도(사진 20MB/장, 하루 2000장 · 동영상 1GB/개, 총 50개 · 누적 12GB)는 `Code.gs` 상수에서 바꾸고, 안내 문구용 값은 `config.js` 의 `uploadImageMax/uploadVideoMax` 를 맞춘다.
Drive 무료 용량은 15GB(Gmail 과 공유) — 동영상을 많이 받으려면 Google One 필요.

## 테마

화이트로 확정 (`<html data-theme="white">`). 비교가 필요하면 `?theme=cream` 으로 열어본다.
