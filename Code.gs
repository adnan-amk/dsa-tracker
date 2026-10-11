// Paste this into Extensions > Apps Script in your Google Sheet.
// Columns (by position): A Date | B Question | C Question_link | D Type | E Difficulty | F Revision Count

const SECRET = '<change-me-to-a-random-string>'; // must match the one in the extension
const SHEET_NAME = '';                         // leave '' to use the first tab

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return (SHEET_NAME && ss.getSheetByName(SHEET_NAME)) || ss.getSheets()[0];
}

function findRow_(sheet, link) {
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][2]).trim() === link) return { row: i + 1, data: values[i] };
  }
  return null;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Lookup: does this link already exist?
function doGet(e) {
  if (e.parameter.secret !== SECRET) return json_({ ok: false, error: 'Bad secret' });
  const found = findRow_(getSheet_(), e.parameter.link || '');
  return json_({ ok: true, exists: !!found, count: found ? Number(found.data[5]) || 0 : 0 });
}

// Add new row, or increment Revision Count if link exists
function doPost(e) {
  const d = JSON.parse(e.postData.contents);
  if (d.secret !== SECRET) return json_({ ok: false, error: 'Bad secret' });

  const sheet = getSheet_();
  const found = findRow_(sheet, d.link);

  if (found) {
    const count = (Number(found.data[5]) || 0) + 1;
    sheet.getRange(found.row, 6).setValue(count);
    return json_({ ok: true, status: 'revised', count });
  }
  sheet.appendRow([d.date, d.question, d.link, d.type, d.difficulty, 0]);
  return json_({ ok: true, status: 'added', count: 0 });
}
