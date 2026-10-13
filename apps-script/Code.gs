/**
 * 사진·동영상 편지함 — Google Apps Script 웹앱
 *
 * 동작 방식 (resumable upload):
 *   브라우저가 파일 정보(이름·크기·종류)만 이 스크립트에 보내면, 스크립트가 "내 권한"으로 Drive 업로드 세션을 열고
 *   세션 URL 을 돌려준다. 실제 바이트는 브라우저가 Google 서버로 직접 8MB 씩 보낸다 (이 스크립트를 거치지 않음).
 *   → Apps Script 의 요청 크기 제한(~50MB)에 걸리지 않아 1GB 동영상도 가능. 크기는 세션에 고정되므로 한도를 우회할 수 없다.
 *
 * 배포 방법 (한 번만):
 *  1. Google Drive 에서 사진을 받을 폴더를 만들고, URL 끝의 폴더 ID 를 FOLDER_ID 에 넣는다.
 *     예) https://drive.google.com/drive/folders/1AbCdEf...  →  "1AbCdEf..."
 *  2. https://script.google.com → 새 프로젝트 → 이 파일 내용을 붙여넣고 저장
 *     (OAuth 범위는 코드에서 자동 감지됨: DriveApp → Drive, UrlFetchApp → 외부 요청, MailApp → 메일.
 *      apps-script/appsscript.json 은 참고용이며 따로 넣지 않아도 된다)
 *  3. 배포 → 새 배포 → 유형: 웹 앱 / 실행 주체: 나 / 액세스 권한: 모든 사용자 → 권한 승인
 *     (범위가 늘어났으므로 기존 배포를 수정할 때도 "권한 검토" 가 한 번 더 뜬다 — 정상)
 *  4. 생성된 "웹 앱 URL" 을 js/config.js 의 uploadUrl 에 붙여넣는다.
 *  5. 코드를 수정하면 반드시 "배포 → 배포 관리 → 연필 → 버전: 새 버전 → 배포" 해야 반영된다. (URL 은 그대로)
 *
 * 운영 스위치 — 재배포 없이, 편집기 상단에서 함수를 고르고 ▶ 실행:
 *  - enableTestMode() / disableTestMode() : 기간 제한 무시 (테스트할 때만. 끝나면 반드시 disable)
 *  - closeUploads() / openUploads()       : 즉시 전부 거부 (비상 정지) / 해제
 *  - showStatus()                         : 현재 상태·누적량 확인 (실행 로그에 출력)
 *  (같은 값을 "프로젝트 설정 → 스크립트 속성 수정" 에서 직접 넣어도 된다: test_mode=1, closed=1)
 *
 * 남용 방지:
 *  - TOKEN          : config.js 의 uploadToken 과 같아야 함. 소스에 노출되지만 무작위 봇은 막는다.
 *  - OPEN_FROM/TO   : 이 기간 밖에서는 세션을 열지 않는다 (서버 시간 기준이라 우회 불가 — 가장 중요한 방어)
 *  - ORIGINS        : 이 사이트에서 온 요청만 (브라우저가 보내는 origin 을 세션에 묶음)
 *  - 사진 20MB/장, 하루 2000장 / 동영상 1GB/개, 총 50개 / 전체 누적 TOTAL_BYTES
 *  - 한도에 걸려 복구해야 하면 편집기에서 resetCounters() 를 한 번 실행
 *
 * Drive 용량: TOTAL_BYTES 는 계정 여유 용량보다 작게 둘 것 (현재 Google One 5TB 기준 100GB).
 */

const FOLDER_ID = "여기에_폴더_ID";
const TOKEN = "ss-270221-letter";
const ORIGINS = ["https://rafael-lee-sw.github.io", "http://localhost:8765"];

const OPEN_FROM = new Date("2027-02-14T00:00:00+09:00");   // 예식 1주 전부터
const OPEN_TO   = new Date("2027-03-08T00:00:00+09:00");   // 예식 보름 후까지

const IMAGE_MAX  = 20 * 1024 * 1024;              // 사진 장당 20MB
const VIDEO_MAX  = 1024 * 1024 * 1024;            // 동영상 개당 1GB
const DAILY_IMAGES = 2000;                        // 하루 사진 장수
const TOTAL_VIDEOS = 50;                          // 동영상 총 개수
const TOTAL_BYTES  = 100 * 1024 * 1024 * 1024;    // 전체 누적 100GB (Google One 5TB 계정 기준. 동영상 50×1GB + 사진 여유)
const ALERT_AT     = 800;                         // 하루 사진 이 건수를 넘기면 본인 메일로 1회 알림 (0 이면 끔)

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const props = PropertiesService.getScriptProperties();
    if (props.getProperty("closed")) return json({ ok: false, error: "closed" });

    const now = new Date();
    if (!props.getProperty("test_mode") && (now < OPEN_FROM || now > OPEN_TO)) return json({ ok: false, error: "closed" });

    const body = JSON.parse(e.postData.contents || "{}") || {};
    if (body.token !== TOKEN) return json({ ok: false, error: "forbidden" });
    if (ORIGINS.indexOf(body.origin) < 0) return json({ ok: false, error: "forbidden" });

    const size = Number(body.size), type = String(body.type || "");
    const isImage = /^image\//.test(type), isVideo = /^video\//.test(type);
    if (!isImage && !isVideo) return json({ ok: false, error: "not media" });
    if (!(size > 0) || size > (isVideo ? VIDEO_MAX : IMAGE_MAX)) return json({ ok: false, error: "too large" });

    // 카운터 (동시 요청 보호)
    lock.waitLock(10000);
    const dayKey = "images_" + Utilities.formatDate(now, "Asia/Seoul", "yyyyMMdd");
    const day = Number(props.getProperty(dayKey) || 0);
    const videos = Number(props.getProperty("videos_total") || 0);
    const bytes = Number(props.getProperty("bytes_total") || 0);
    if (bytes + size > TOTAL_BYTES || (isImage && day >= DAILY_IMAGES) || (isVideo && videos >= TOTAL_VIDEOS)) {
      lock.releaseLock(); return json({ ok: false, error: "limit" });
    }
    const upd = { bytes_total: String(bytes + size) };
    if (isImage) upd[dayKey] = String(day + 1); else upd.videos_total = String(videos + 1);
    props.setProperties(upd);
    lock.releaseLock();

    if (ALERT_AT && isImage && day + 1 === ALERT_AT) alert(`편지함: 오늘 사진 ${ALERT_AT}장을 넘었습니다. 남용이 의심되면 스크립트 속성에 closed=1 을 추가하세요.`);

    // 파일명: 날짜시각_보낸사람_원본이름.확장자
    const ts = Utilities.formatDate(now, "Asia/Seoul", "yyyyMMdd-HHmmss");
    const sender = clean(body.sender).slice(0, 20);
    const orig = String(body.name || (isVideo ? "video" : "photo"));
    const ext = (orig.match(/\.([a-z0-9]{2,5})$/i) || [, isVideo ? "mp4" : "jpg"])[1].toLowerCase();
    const base = clean(orig.replace(/\.[^.]+$/, "")).slice(0, 40);
    const name = `${ts}_${sender ? sender + "_" : ""}${base}.${ext}`;

    // 폴더 존재 확인 (+ 이 DriveApp 호출이 있어야 Drive 권한 범위가 자동으로 포함된다)
    DriveApp.getFolderById(FOLDER_ID);

    // Drive 에 재개 가능 업로드 세션 열기 (내 권한). 브라우저는 돌려받은 URL 로 직접 올린다.
    const res = UrlFetchApp.fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable", {
      method: "post",
      contentType: "application/json; charset=UTF-8",
      headers: {
        Authorization: "Bearer " + ScriptApp.getOAuthToken(),
        "X-Upload-Content-Type": type,
        "X-Upload-Content-Length": String(size),
        Origin: body.origin,            // 브라우저에서 조각을 올릴 수 있도록 CORS 를 이 origin 에 묶음
      },
      payload: JSON.stringify({ name, parents: [FOLDER_ID] }),
      muteHttpExceptions: true,
    });
    const hdr = res.getAllHeaders(); const loc = hdr["Location"] || hdr["location"];
    if (res.getResponseCode() !== 200 || !loc) { console.error("session", res.getResponseCode(), res.getContentText()); return json({ ok: false, error: "error" }); }
    return json({ ok: true, url: loc });
  } catch (err) {
    try { lock.releaseLock(); } catch (_) {}
    console.error(err);
    return json({ ok: false, error: "error" });
  }
}

// 브라우저에서 URL 을 직접 열었을 때 살아있는지 확인용
function doGet() {
  return json({ ok: true, service: "photo-letterbox", mode: "resumable" });
}

// 권한 범위 선언용 — 실행되지 않지만, Apps Script 가 코드를 읽고 Drive "쓰기" 권한까지 요청하게 만든다.
// (getFolderById 만 있으면 읽기 전용으로 감지되어 업로드 세션이 403 으로 거부될 수 있음)
function _declareScopes() {
  DriveApp.getFolderById(FOLDER_ID).createFile("scope", "scope");
  UrlFetchApp.fetch("https://www.googleapis.com/");
  MailApp.sendEmail("", "", "");
}

// 설정 점검 — 편집기에서 ▶ 실행하면 폴더 접근·토큰 권한을 확인해 로그에 출력
function checkSetup() {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  console.log("folder OK: " + folder.getName());
  const r = UrlFetchApp.fetch("https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=" + ScriptApp.getOAuthToken(), { muteHttpExceptions: true });
  console.log("token scopes: " + (JSON.parse(r.getContentText()).scope || r.getContentText()));
}

// ── 운영 스위치: 편집기 상단 함수 선택 → ▶ 실행 (스크립트 속성 화면을 안 거쳐도 됨) ──
function enableTestMode()  { PropertiesService.getScriptProperties().setProperty("test_mode", "1");  console.log("test_mode ON — 기간 제한 무시"); }
function disableTestMode() { PropertiesService.getScriptProperties().deleteProperty("test_mode");    console.log("test_mode OFF"); }
function closeUploads()    { PropertiesService.getScriptProperties().setProperty("closed", "1");     console.log("closed — 모든 업로드 거부"); }
function openUploads()     { PropertiesService.getScriptProperties().deleteProperty("closed");       console.log("open"); }
function showStatus() {
  const p = PropertiesService.getScriptProperties().getProperties();
  console.log(JSON.stringify({ test_mode: !!p.test_mode, closed: !!p.closed, videos_total: p.videos_total || 0, bytes_total_GB: (Number(p.bytes_total || 0) / 1073741824).toFixed(2),
    today_images: p["images_" + Utilities.formatDate(new Date(), "Asia/Seoul", "yyyyMMdd")] || 0 }, null, 2));
}

// 한도에 걸려 복구할 때 편집기에서 직접 실행
function resetCounters() {
  const p = PropertiesService.getScriptProperties();
  Object.keys(p.getProperties()).filter((k) => /^(images_|alerted_)/.test(k) || k === "bytes_total" || k === "videos_total").forEach((k) => p.deleteProperty(k));
  console.log("counters reset");
}

function alert(msg) {
  try {
    const p = PropertiesService.getScriptProperties();
    const key = "alerted_" + Utilities.formatDate(new Date(), "Asia/Seoul", "yyyyMMdd");
    if (p.getProperty(key)) return;
    MailApp.sendEmail(Session.getEffectiveUser().getEmail(), "[청첩장] 편지함 업로드 급증", msg);
    p.setProperty(key, "1");
  } catch (_) {}
}

function clean(s)  { return String(s || "").replace(/[\u0000-\u001F​-‏‪-‮]/g, "").replace(/[\\/:*?"<>|\s]+/g, "_").replace(/^_+|_+$/g, ""); }
function json(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
