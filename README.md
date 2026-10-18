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

## 실물 청첩장 반영 상태

실물 청첩장 그림(`assets/source/실물 앞면_달리는 신랑신부.jpg`, `실물 뒷면_꽃덩굴.jpg`)과 예식장 약도까지 모두 반영 완료.

### 1) 약도 (반영 완료)
예식장 제공 약도(`assets/source/엘블레스 약도(예식장 제공).jpg`)에서 아래 회색 안내 블록을 잘라 `assets/illust/map.webp` 로 저장, `config.js` `venue.mapImage` 에 연결.
다른 약도로 바꾸려면 파일만 교체하면 된다(세로/가로 비율 무관 — 그림 비율대로 표시됨).

### 2) 실물 그림 (반영 완료, 2026-10-18 컬러판으로 교체)

| 그림 | 파일 | 쓰이는 곳 |
|---|---|---|
| 달리는 신랑신부 (컬러, 반짝이·봉투) | `assets/illust/running.{png,webp}`, `running@800.*` | 히어로 (`.hero__art`) |
| 수레 신랑신부 (컬러) | `assets/illust/wheelbarrow.*`, `wheelbarrow@800.*` | 사진 편지함 (`.letterbox__art`) |
| 꽃 덩굴 (실물 뒷면 세로 장식) | `assets/illust/vine.*` | 초대글 오른쪽 (`.greeting__vine`) |
| 손글씨 "Soowan & Sojeong" | `assets/illust/names.*` | OG 이미지 재료 (페이지에는 아직 안 씀) |
| 손글씨 + 컬러 그림 (크림 종이색 바탕) | `assets/illust/og.jpg` | 카카오톡 미리보기 |

아직 예전 GPT 그림인 것(화풍이 다름): 인사하는 신랑신부(`bow.*`, 푸터), 봉투(`envelope.*`, 인트로), 우편가방(`mailbag@300.*`), 리본(`ribbon.*`), 섹션 아이콘(`ico-*`).
→ **`docs/그림-생성-프롬프트.md`** 에 ChatGPT 로 다시 만들 프롬프트가 그림별로 정리되어 있다.

다시 만들기 (원본은 크림색 종이 질감이라 `cut-paper.py` 사용):
```
python tools/cut-paper.py "assets/source/실물 앞면_달리는 신랑신부(컬러).jpg" running     1400 --box 500,800,3000,2150 --min-area 250
python tools/cut-paper.py "assets/source/실물 앞면_달리는 신랑신부(컬러).jpg" running@800  800 --box 500,800,3000,2150 --min-area 250
python tools/cut-paper.py "assets/source/수레 신랑신부(컬러).jpg"             wheelbarrow 1400 --box 700,800,2600,2150 --min-area 250 --sheer 1480,860,2010,1310
python tools/cut-paper.py "assets/source/수레 신랑신부(컬러).jpg"             wheelbarrow@800 800 --box 700,800,2600,2150 --min-area 250 --sheer 1480,860,2010,1310
python tools/cut-paper.py "assets/source/실물 뒷면_꽃덩굴.jpg"                vine        1200 --box 1560,0,1980,2480 --min-area 250 --pad 12
python tools/cut-paper.py "assets/source/실물 앞면_달리는 신랑신부.jpg"       names       2000 --box 900,200,2800,1030 --drop-below 840 --min-area 250
```
`--drop-above / --drop-below` 는 손글씨와 그림을 분리하는 옵션. 종이색과 비슷한 연분홍 드레스·피부·베일이 빠지면 `--paper` 값을 낮춘다(기본 5.5). `--sheer` 는 수레 그림의 베일(원본에서 드레스와 같은 연분홍)을 흰 배경에서 베일로 읽히게 반투명 처리하는 영역.
그림 파일 주소에는 `?v=` 가 붙어 있다 — 그림을 바꾸면 `index.html` 에서 이 값도 올려야 브라우저 캐시가 갱신된다. OG 는 `names` + `running` 을 1200×630 흰 바탕에 올린 것.
OG 를 바꾸면 developers.kakao.com/tool/clear/og 에서 캐시 삭제.

### 3) 실물에서 가져온 문구·폰트 (이미 반영됨)
- 인사말: 실물 뒷면 문구 그대로 (`config.js` `greeting.body`)
- 영문 손글씨: Caveat (`--font-hand`), 한글 손글씨: Nanum Pen Script (`--font-hand-ko`) — `css/style.css` 상단 토큰
- "Kindly join us for the wedding of" / "Feb. 21st, 2027 · 12:30 PM" / "차남 수완 · 장녀 소정"

## 그림 추가하기

원본은 `assets/source/` 에 두고, 배경 제거는 흰 배경이면 `tools/cut-illust.py`, 크림색·종이 질감 배경이면 `tools/cut-paper.py` 로 한다.

## 사진·동영상 편지함 연결

`apps-script/Code.gs` 상단 주석 참고. 권한 범위는 코드에서 자동 감지되므로 `appsscript.json` 은 참고용(선택).
배포된 웹앱 URL 을 `js/config.js` 의 `uploadUrl` 에 넣는다.

전송 방식: 브라우저 → Apps Script(세션만 발급) → 브라우저가 Google 서버로 직접 8MB 씩 조각 전송.
한도(사진 20MB/장, 하루 2000장 · 동영상 1GB/개, 총 50개 · 누적 12GB)는 `Code.gs` 상수에서 바꾸고, 안내 문구용 값은 `config.js` 의 `uploadImageMax/uploadVideoMax` 를 맞춘다.
Drive 무료 용량은 15GB(Gmail 과 공유) — 동영상을 많이 받으려면 Google One 필요.

## 테마

**화이트로 확정** (`<html data-theme="white">`, 2026-10-18). 비교가 필요하면 `?theme=cream` 으로 열어본다.
크림 토큰은 `css/style.css` 에 남겨 두었다.

## 참석 의사 (RSVP)

이름 + 참석 여부만 받는다. 사진 편지함과 같은 Apps Script 웹앱으로 보내며(`action: "rsvp"`), 서버가 구글 시트 "수완♥소정 참석 의사 (RSVP)" 에 한 줄씩 기록한다 (시트는 첫 요청 때 Drive 폴더에 자동 생성).
- 접수 기간: 예식 당일까지 (`Code.gs` `RSVP_UNTIL`). 사진 편지함 기간 제한과는 별개.
- **Code.gs 를 바꿨으므로 Apps Script 를 "새 버전" 으로 다시 배포해야 동작한다.** 스프레드시트 권한이 추가되어 권한 검토가 한 번 더 뜬다.
- 시트 주소는 편집기에서 `showRsvpSheet()` 실행 → 로그.
- 보낸 사람 기기에는 localStorage 로 기록이 남아 "다시 전달하기" 로 바꿀 수 있다 (시트에는 새 줄로 추가됨 — 같은 이름의 마지막 줄이 최신).

## 캘린더에 추가

- Google 캘린더: `config.js` 의 `date` / `venue` 로 링크를 자동 생성.
- iPhone: `assets/wedding.ics` 정적 파일 (Safari 에서 열면 "캘린더에 추가"). 날짜·장소가 바뀌면 이 파일도 손으로 고친다 (UTC 기준: 12:30 KST = 03:30Z).

## 연락하기

신랑·신부 + 양가 부모님 번호가 그대로 표시된다 (`config.js` 의 `tel`, `fatherTel`, `motherTel`). 번호를 누르면 복사, ☎ 를 누르면 전화.
