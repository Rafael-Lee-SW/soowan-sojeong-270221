# 모바일 청첩장

순수 HTML/CSS/JS, 빌드 없음. `main`에 push하면 GitHub Pages로 배포된다.

## 구조

```
index.html            페이지 (섹션 8개)
css/style.css         스타일 (상단 :root 에 글꼴·색 토큰)
css/fonts.css         자체 호스팅 글꼴 선언
js/config.js          예식 정보·계좌·업로드 URL 등 내용은 전부 여기
js/photos.js          갤러리 목록 (자동 생성)
js/main.js            동작 (봉투 인트로, 달력, 갤러리, RSVP, 업로드, 공유)
assets/illust/        그림 (웹용)
assets/photos/        갤러리 사진 (웹용, 자동 생성)
assets/fonts/         KoPub woff2
apps-script/Code.gs   사진 편지함·RSVP 서버 (Google Apps Script)
docs/                 그림 생성 프롬프트
tools/                아래 스크립트
originals/, font/     사진·글꼴 원본 (git 제외)
```

## 로컬 미리보기

```
python tools/serve.py
```

http://localhost:8000 에서 확인. 파일을 저장하면 자동 새로고침된다. 같은 와이파이의 휴대폰은 실행 시 출력되는 주소로 접속.

## 글꼴

| 용도 | 글꼴 | 출처 |
|---|---|---|
| 한글 본문 | KoPub 돋움 | `assets/fonts/` |
| 한글 제목 | KoPub 바탕 | `assets/fonts/` |
| 영문 이름 | WindSong | Google Fonts |
| 영문 소제목 | Caveat | Google Fonts |
| 영문·숫자 | Cormorant Garamond | Google Fonts |
| 한글 손글씨 | Nanum Pen Script | Google Fonts |

KoPub은 `font/`의 TTF를 `python tools/subset-fonts.py`로 필요한 글자만 남겨 woff2로 만든 것. 문구가 바뀌어 없는 글자가 생기면 다시 돌린다.

## 사진 넣기

1. `originals/`에 원본을 넣는다 (파일명 순서 = 갤러리 순서)
2. `python tools/resize-photos.py`
3. commit & push

## 그림

원본은 `assets/source/`에 두고, 배경이 흰색이면 `tools/cut-illust.py`, 종이 질감이면 `tools/cut-paper.py`로 배경을 뗀다.
카카오톡 미리보기 그림은 `tools/make-og.py`. 그림을 바꾸면 `index.html`의 `?v=` 값을 올려야 캐시가 갱신된다.

## 사진 편지함 · RSVP

`apps-script/Code.gs`를 Apps Script에 붙여 웹앱으로 배포하고, 그 URL을 `js/config.js`의 `uploadUrl`에 넣는다.
업로드 한도는 `Code.gs` 상수, 안내 문구의 숫자는 `config.js`에서 맞춘다. RSVP는 같은 웹앱이 구글 시트에 기록한다. `Code.gs`를 고치면 새 버전으로 다시 배포해야 반영된다.

## 캘린더

Google 캘린더 링크는 `config.js`의 날짜·장소로 자동 생성. iPhone용 `assets/wedding.ics`는 날짜가 바뀌면 직접 고친다.
