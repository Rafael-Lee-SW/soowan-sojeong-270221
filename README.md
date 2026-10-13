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

## 약도 넣기

약도 이미지를 `assets/illust/map.png` 로 저장하고 `js/config.js` 의 `venue.mapImage` 를 `"assets/illust/map.png"` 로 바꾼다. 4:3 비율이 가장 잘 맞는다.

## 그림 추가하기

GPT 등에서 받은 원본은 `assets/source/` 에 두고, 배경 제거·분할은 `tools/cut-illust.py` 로 한다(흰 배경 기준).

## 사진 편지함 연결

`apps-script/Code.gs` 상단 주석 참고. 배포된 웹앱 URL 을 `js/config.js` 의 `uploadUrl` 에 넣는다.

## 테마

화이트로 확정 (`<html data-theme="white">`). 비교가 필요하면 `?theme=cream` 으로 열어본다.
