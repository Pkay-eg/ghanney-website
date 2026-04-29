// Google Apps Script — Paste this into Extensions → Apps Script on your Google Sheet
// Sheet: PKay @ 30 (1qzbet0sbPI3Ee6ZjJDEF2peed92K3RoPE7UYtE4MbiQ)

const SHEET_NAME = "RSVPs";

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sh = ss.getSheetByName(SHEET_NAME);

    if (!sh) {
      sh = ss.insertSheet(SHEET_NAME);
      sh.appendRow([
        "Timestamp", "Code", "Name", "Phone", "Email",
        "Attend", "Guests", "Guest Names", "Message",
        "Tier", "Type", "Step Reached", "Session ID", "Source"
      ]);
      sh.getRange(1, 1, 1, 14).setFontWeight("bold");
    }

    const d = JSON.parse(e.postData.contents);

    sh.appendRow([
      new Date(),
      d.code || "",
      d.name || "",
      d.phone || "",
      d.email || "",
      d.attend || "",
      d.guests || "",
      (d.guestNames || []).join(", "),
      d.message || "",
      d.tier || "",
      d._type || "completed",
      d._stepReached != null ? d._stepReached : "",
      d._sessionId || "",
      "ghanney.com/pkay30"
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_NAME);

  if (!sh || sh.getLastRow() <= 1) {
    return ContentService
      .createTextOutput(JSON.stringify({ rows: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const data = sh.getDataRange().getValues();
  const [headers, ...rows] = data;

  const result = rows.map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });

  return ContentService
    .createTextOutput(JSON.stringify({ rows: result }))
    .setMimeType(ContentService.MimeType.JSON);
}
