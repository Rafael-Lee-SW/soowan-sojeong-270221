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
 *  4. 코드를 수정하면 반드시 "배포 관리 → 새 버전" 으로 다시 배포해야 반영된다.
 */

const FOLDER_ID = "여기에_폴더_ID";
const MAX_BYTES = 25 * 1024 * 1024;   // 장당 최대 25MB (base64 디코드 기준)
const ALLOWED = /^image\//;

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    if (!body.data) return json({ ok: false, error: "no data" });

    const bytes = Utilities.base64Decode(body.data);
    if (bytes.length > MAX_BYTES) return json({ ok: false, error: "too large" });

    const blob = Utilities.newBlob(bytes, "image/jpeg");
    if (!ALLOWED.test(blob.getContentType())) return json({ ok: false, error: "not image" });

    const ts = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyyMMdd-HHmmss");
    const sender = String(body.sender || "").replace(/[\\/:*?"<>|]/g, "").trim();
    const base = String(body.name || "photo").replace(/\.[^.]+$/, "").replace(/[\\/:*?"<>|]/g, "").slice(0, 40);
    blob.setName(`${ts}_${sender ? sender + "_" : ""}${base}.jpg`);

    const file = DriveApp.getFolderById(FOLDER_ID).createFile(blob);
    return json({ ok: true, id: file.getId() });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

// 브라우저에서 URL을 직접 열었을 때 살아있는지 확인용
function doGet() {
  return json({ ok: true, service: "photo-letterbox" });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
