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

실물 청첩장(`assets/source/실물 앞면_달리는 신랑신부.jpg`, `실물 뒷면_꽃덩굴.jpg`)의 그림은 반영 완료. **약도**만 남았다.

### 1) 약도 (아직)
1. 약도 파일을 `assets/illust/map.png` (또는 .webp/.jpg) 로 저장 — 4:3 비율이 지도 칸에 가장 잘 맞음. 흰 배경이면 `python tools/cut-illust.py <원본> map 1200` 으로 투명화 가능
2. `js/config.js` → `venue.mapImage: "assets/illust/map.png"`
3. 끝. (`index.html` 의 "약도 준비 중" 플레이스홀더는 자동으로 교체됨)

### 2) 실물 그림 (반영 완료)

| 그림 | 파일 | 쓰이는 곳 |
|---|---|---|
| 달리는 신랑신부 (실물 앞면, 흑백 선화 + 반짝이) | `assets/illust/running.{png,webp}`, `running@800.*` | 히어로 (`index.html` `.hero__art`) |
| 꽃 덩굴 (실물 뒷면 세로 장식) | `assets/illust/vine.*` | 초대글 오른쪽 (`.greeting__vine`) |
| 앞면 전체 (손글씨 이름 + 그림) | `assets/illust/og.jpg` | 카카오톡 미리보기 |

GPT 그림 그대로인 것: 수레 신랑신부(`wheelbarrow.*`, 사진 편지함), 인사하는 신랑신부(`bow.*`, 푸터), 봉투(`envelope.*`, 인트로), 우편가방(`mailbag@300.*`, 업로드 버튼).

다시 만들기 (원본은 크림색 종이 질감이라 `cut-paper.py` 사용):
```
python tools/cut-paper.py "assets/source/실물 앞면_달리는 신랑신부.jpg" running     1400 --box 500,600,3000,2150 --drop-above 840 --min-area 250
python tools/cut-paper.py "assets/source/실물 앞면_달리는 신랑신부.jpg" running@800  800 --box 500,600,3000,2150 --drop-above 840 --min-area 250
python tools/cut-paper.py "assets/source/실물 뒷면_꽃덩굴.jpg"          vine        1200 --box 1560,0,1980,2480 --min-area 250 --pad 12
```
`--drop-above 840` 은 그림 위의 손글씨 "Soowan & Sojeong" 을 떼어내는 옵션(이름은 HTML 에서 폰트로 찍음).
OG 는 같은 스크립트로 `--box 500,200,3000,2150` (손글씨 포함) 으로 뽑아 1200×630 흰 배경 가운데에 올린 것.
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

화이트로 확정 (`<html data-theme="white">`). 비교가 필요하면 `?theme=cream` 으로 열어본다.
