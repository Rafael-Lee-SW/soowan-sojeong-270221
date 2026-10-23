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
tools/serve.py      로컬 미리보기 (자동 새로고침)
tools/ribbon-path.py  (예전) 글씨 없는 리본에 코드 글씨를 얹을 때 곡선 측정 — 지금 리본은 글씨가 그림에 포함되어 안 씀
```

## 로컬에서 보기

```
python tools/serve.py
```
→ http://localhost:8000 (같은 와이파이의 휴대폰은 실행 시 출력되는 `http://192.168.x.x:8000`)
캐시를 끄고, html/css/js/그림을 저장하면 열린 페이지가 자동 새로고침된다 — 배포 전에 여기서 확인하고 push.
(file:// 로 열면 fetch/폰트가 막힐 수 있음)

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
| 꽃 덩굴 (실물 뒷면 세로 장식) | `assets/illust/vine.*` → 90° 돌린 `vine-h.*` | 초대글 본문과 양가 소개 사이 가로 구분선 (`.greeting__vine`, 2026-10-20) |
| 손글씨 "Soowan & Sojeong" | `assets/illust/names.*` | OG 이미지 재료 (페이지에는 아직 안 씀) |
| 손글씨 + 컬러 그림 (흰 바탕) | `assets/illust/og.jpg` (`tools/make-og.py`) | 카카오톡 미리보기 |

인사하는 신랑신부(`bow.*`, 푸터)는 2026-10-19 새 화풍으로 교체 (`assets/source/수줍게 함께 인사하는 신랑신부.png` → `cut-paper.py`).
리본(`ribbon.*`)은 2026-10-20 "Thank you" 글씨가 포함된 새 그림으로 교체 (`assets/source/Thank you 리본 배너.png` → `cut-paper.py ... ribbon 900`), 코드 글씨(SVG textPath)는 제거.
아직 예전 GPT 그림인 것(화풍이 다름): 봉투(`envelope.*`, 인트로), 우편가방(`mailbag@300.*`), 섹션 아이콘(`ico-*`).
→ **`docs/그림-생성-프롬프트.md`** 에 ChatGPT 로 다시 만들 프롬프트가 그림별로 정리되어 있다.

다시 만들기 (원본은 크림색 종이 질감이라 `cut-paper.py` 사용):
```
python tools/cut-paper.py "assets/source/실물 앞면_달리는 신랑신부(컬러).jpg" running     1400 --box 500,800,3000,2150
python tools/cut-paper.py "assets/source/실물 앞면_달리는 신랑신부(컬러).jpg" running@800  800 --box 500,800,3000,2150
python tools/cut-paper.py "assets/source/수레 신랑신부(컬러).jpg"             wheelbarrow 1400 --box 700,800,2600,2150
python tools/cut-paper.py "assets/source/수레 신랑신부(컬러).jpg"             wheelbarrow@800 800 --box 700,800,2600,2150
python tools/cut-paper.py "assets/source/실물 뒷면_꽃덩굴.jpg"                vine        1200 --box 1560,0,1980,2480 --pad 12
python -c "from PIL import Image; im=Image.open('assets/illust/vine.png').rotate(90, expand=True); im.save('assets/illust/vine-h.png', optimize=True); im.save('assets/illust/vine-h.webp', quality=88, method=6)"   # 세로 덩굴 → 가로 구분선
python tools/cut-paper.py "assets/source/실물 앞면_달리는 신랑신부.jpg"       names       2000 --box 900,200,2800,1030 --drop-below 840
python tools/make-og.py
```
`cut-paper.py` 는 "종이 나누기" 방식(2026-10-19): 실물 원본 4장은 같은 종이 질감 레이어를 쓰므로(섬유 티까지 픽셀 단위로 동일) 4장을 겹쳐 종이 지도를 복원하고, 원본 ÷ 종이 → 흰색을 투명으로 분리한다.
그림/배경 경계를 판정하지 않으므로 베이지 덩어리·테두리 보풀이 생기지 않고, 선 안의 빈 종이(수레 다리 사이 등)는 투명해진다.
연분홍 베일·드레스는 종이 위에서는 베이지와의 색 대비로 보이지만 흰 바탕에서는 거의 흰색이 되므로, 옅은 면만 `--boost`(기본 2.5배)로 진하게 한다 — 선·진한 색은 그대로. 1 이면 원본 그대로.
**흰 바탕 전용** — 크림 테마나 어두운 바탕에 올리면 옅은 면이 비친다. 새 실물 원본을 넣을 때는 같은 크기(3508×2480)의 jpg 를 `assets/source/` 에 두면 종이 지도에 자동으로 합쳐진다.
`--drop-above / --drop-below` 는 손글씨와 그림을 분리하는 옵션.
그림 파일 주소에는 `?v=` 가 붙어 있다 — 그림을 바꾸면 `index.html` 에서 이 값도 올려야 배포 후 브라우저 캐시가 갱신된다 (`tools/serve.py` 미리보기는 캐시를 끄므로 상관없음).
OG 를 바꾸면 `index.html` 의 og:image 와 `js/main.js` 의 카카오 공유 imageUrl 에 붙은 `?v=` 도 올리고, developers.kakao.com/tool/clear/og 에 페이지 주소를 넣어 미리보기 캐시를 지운다 (카카오는 페이지 단위로 미리보기를 오래 캐시해서, 파일만 바꾸면 옛 그림이 계속 보인다).

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
