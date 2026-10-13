/**
 * 사진 편지함 — Google Apps Script 웹앱
 *
 * 배포 방법 (한 번만):
 *  1. Google Drive에서 사진을 받을 폴더를 만들고, URL 끝의 폴더 ID를 FOLDER_ID 에 넣는다.
 *     예) https://drive.google.com/drive/folders/1AbCdEf...  →  "1AbCdEf..."
 *  2. https://script.google.com → 새 프로젝트 → 이 파일 내용을 붙여넣고 저장
 *  3. 배포 → 새 배포 → 유형: 웹 앱
 *       - 실행 주체: 나
 *       - 액세스 권한: 모든 사용자
 *     → 권한 승인 → 생성된 "웹 앱 URL"을 js/config.js 의 uploadUrl 에 붙여넣는다.
 *  4. 코드를 수정하면 반드시 "배포 → 배포 관리 → 연필 → 버전: 새 버전 → 배포" 해야 반영된다.
 *     (URL 은 그대로 유지됨)
 *
 * 남용 방지 (아래 상수로 조절):
 *  - TOKEN        : config.js 의 uploadToken 과 같아야 저장. 소스에 노출되지만 무작위 봇은 막는다.
 *  - OPEN_FROM/TO : 이 기간 밖에서는 아무것도 받지 않는다 (서버 시간 기준이라 우회 불가)
 *  - MAX_BYTES    : 장당 최대 크기
 *  - DAILY_LIMIT  : 하루 최대 장수 — 넘으면 그날은 거부
 *  - TOTAL_LIMIT  : 전체 누적 최대 장수
 *  - 비상 정지    : 스크립트 편집기 → 프로젝트 설정 → 스크립트 속성에  closed = 1  추가
 */

const FOLDER_ID = "여기에_폴더_ID";
const TOKEN = "ss-270221-letter";

const OPEN_FROM = new Date("2027-02-14T00:00:00+09:00");   // 예식 1주 전부터
const OPEN_TO   = new Date("2027-03-08T00:00:00+09:00");   // 예식 보름 후까지
const TEST_MODE = true;   // true 면 기간 제한 무시 (테스트 끝나면 false 로)

const MAX_BYTES   = 25 * 1024 * 1024;
const DAILY_LIMIT = 600;
const TOTAL_LIMIT = 3000;

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const props = PropertiesService.getScriptProperties();
    if (props.getProperty("closed")) return json({ ok: false, error: "closed" });

    const now = new Date();
    if (!TEST_MODE && (now < OPEN_FROM || now > OPEN_TO)) return json({ ok: false, error: "closed" });

    const body = JSON.parse(e.postData.contents || "{}");
    if (body.token !== TOKEN) return json({ ok: false, error: "forbidden" });
    if (!body.data) return json({ ok: false, error: "no data" });

    // base64 길이로 먼저 거르고(디코드 비용 절약), 디코드 후 다시 확인
    if (body.data.length > MAX_BYTES * 1.4) return json({ ok: false, error: "too large" });
    const bytes = Utilities.base64Decode(body.data);
    if (bytes.length > MAX_BYTES) return json({ ok: false, error: "too large" });
    if (!isJpeg(bytes) && !isPng(bytes)) return json({ ok: false, error: "not image" });

    // 카운터 (동시 요청 보호)
    lock.waitLock(10000);
    const dayKey = "count_" + Utilities.formatDate(now, "Asia/Seoul", "yyyyMMdd");
    const day = Number(props.getProperty(dayKey) || 0);
    const total = Number(props.getProperty("count_total") || 0);
    if (day >= DAILY_LIMIT || total >= TOTAL_LIMIT) { lock.releaseLock(); return json({ ok: false, error: "limit" }); }
    props.setProperties({ [dayKey]: String(day + 1), count_total: String(total + 1) });
    lock.releaseLock();

    const ts = Utilities.formatDate(now, "Asia/Seoul", "yyyyMMdd-HHmmss");
    const sender = clean(body.sender).slice(0, 20);
    const base = clean(String(body.name || "photo").replace(/\.[^.]+$/, "")).slice(0, 40);
    const blob = Utilities.newBlob(bytes, isPng(bytes) ? "image/png" : "image/jpeg",
      `${ts}_${sender ? sender + "_" : ""}${base}.${isPng(bytes) ? "png" : "jpg"}`);

    const file = DriveApp.getFolderById(FOLDER_ID).createFile(blob);
    return json({ ok: true, id: file.getId() });
  } catch (err) {
    try { lock.releaseLock(); } catch (_) {}
    return json({ ok: false, error: String(err) });
  }
}

// 브라우저에서 URL을 직접 열었을 때 살아있는지 확인용
function doGet() {
  const p = PropertiesService.getScriptProperties();
  return json({ ok: true, service: "photo-letterbox", total: Number(p.getProperty("count_total") || 0) });
}

function isJpeg(b) { return b.length > 3 && (b[0] & 255) === 0xFF && (b[1] & 255) === 0xD8; }
function isPng(b)  { return b.length > 8 && (b[0] & 255) === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47; }
function clean(s)  { return String(s || "").replace(/[\\/:*?"<>|\s]+/g, "_").replace(/^_+|_+$/g, ""); }
function json(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
