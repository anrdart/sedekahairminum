/**
 * SEDEKAH AIR MINUM — Google Apps Script
 *
 * CARA DEPLOY:
 * 1. Buat Google Spreadsheet baru (kosong)
 * 2. Klik Extensions > Apps Script
 * 3. Hapus isi default, paste seluruh kode ini
 * 4. Klik fungsi "setupSheet" di dropdown atas, lalu Run (izinkan akses)
 * 5. Klik Deploy > New Deployment
 * 6. Pilih type: Web app
 * 7. Execute as: Me, Who has access: Anyone
 * 8. Copy URL deployment, paste di kontak.astro (variabel APPS_SCRIPT_URL)
 */

// ─────────────────────────────────────────────
// JALANKAN SEKALI: Setup spreadsheet dengan format cantik
// ─────────────────────────────────────────────
function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();

  // Rename sheet
  sheet.setName('Data Pesan Masuk');
  ss.rename('Sedekah Air Minum — Pesan Kontak');

  // Header
  var headers = ['No', 'Tanggal & Waktu', 'Nama Lengkap', 'No. WhatsApp', 'Email', 'Topik', 'Pesan'];
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);

  // ── Header styling ──
  headerRange.setFontFamily('Inter');
  headerRange.setFontWeight('bold');
  headerRange.setFontSize(10);
  headerRange.setFontColor('#ffffff');
  headerRange.setBackground('#0e7c8c');
  headerRange.setHorizontalAlignment('center');
  headerRange.setVerticalAlignment('middle');
  headerRange.setWrap(false);
  sheet.setRowHeight(1, 40);

  // ── Column widths ──
  sheet.setColumnWidth(1, 50);    // No
  sheet.setColumnWidth(2, 185);   // Tanggal
  sheet.setColumnWidth(3, 200);   // Nama
  sheet.setColumnWidth(4, 155);   // WhatsApp
  sheet.setColumnWidth(5, 210);   // Email
  sheet.setColumnWidth(6, 185);   // Topik
  sheet.setColumnWidth(7, 420);   // Pesan

  // ── Freeze header ──
  sheet.setFrozenRows(1);

  // ── Default format for data area (rows 2-1000) ──
  var dataRange = sheet.getRange(2, 1, 999, headers.length);
  dataRange.setFontFamily('Inter');
  dataRange.setFontSize(10);
  dataRange.setVerticalAlignment('top');
  dataRange.setWrap(true);

  // No column — center
  sheet.getRange(2, 1, 999, 1).setHorizontalAlignment('center').setFontColor('#5d7281');
  // Tanggal — center, mono font
  sheet.getRange(2, 2, 999, 1).setHorizontalAlignment('center').setFontFamily('JetBrains Mono').setFontSize(9).setFontColor('#5d7281');
  // Nama — bold
  sheet.getRange(2, 3, 999, 1).setFontWeight('bold');
  // WhatsApp — mono
  sheet.getRange(2, 4, 999, 1).setFontFamily('JetBrains Mono').setFontSize(9);
  // Email — regular
  sheet.getRange(2, 5, 999, 1).setFontColor('#0891b2');
  // Topik — bold aqua
  sheet.getRange(2, 6, 999, 1).setFontWeight('bold').setFontColor('#0e7c8c');
  // Pesan — wrapped, smaller
  sheet.getRange(2, 7, 999, 1).setFontSize(9).setWrap(true);

  // ── Alternating row colors (conditional) ──
  var rule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND(ISEVEN(ROW()), ROW()>1)')
    .setBackground('#f0f7f9')
    .setRanges([sheet.getRange(2, 1, 999, headers.length)])
    .build();
  sheet.setConditionalFormatRules([rule]);

  // ── Border on header ──
  headerRange.setBorder(true, true, true, true, false, false, '#0a5f6b', SpreadsheetApp.BorderStyle.SOLID);

  // ── Title row above header (merge) ──
  sheet.insertRowBefore(1);
  var titleRange = sheet.getRange(1, 1, 1, headers.length);
  titleRange.merge();
  titleRange.setValue('SEDEKAH AIR MINUM — Data Pesan Kontak Website');
  titleRange.setFontFamily('Inter');
  titleRange.setFontSize(13);
  titleRange.setFontWeight('bold');
  titleRange.setFontColor('#050d14');
  titleRange.setBackground('#5ee4f0');
  titleRange.setHorizontalAlignment('center');
  titleRange.setVerticalAlignment('middle');
  sheet.setRowHeight(1, 44);

  // Update freeze to include title
  sheet.setFrozenRows(2);

  // ── Info row ──
  sheet.insertRowAfter(2);
  var infoRange = sheet.getRange(3, 1, 1, headers.length);
  infoRange.merge();
  infoRange.setValue('Data otomatis tercatat dari form kontak sedekahairminum.com — Yayasan Gerakan Wakaf Sumur');
  infoRange.setFontFamily('Inter');
  infoRange.setFontSize(8);
  infoRange.setFontStyle('italic');
  infoRange.setFontColor('#8ba0ad');
  infoRange.setBackground('#f4f7f9');
  infoRange.setHorizontalAlignment('center');
  sheet.setRowHeight(3, 28);

  // Update freeze
  sheet.setFrozenRows(3);

  SpreadsheetApp.getUi().alert('Setup selesai! Sheet siap menerima data dari website.');
}


// ─────────────────────────────────────────────
// HANDLER: Terima data dari form website
// ─────────────────────────────────────────────
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    var lastRow = sheet.getLastRow();
    var no = lastRow - 2; // offset title + info + header rows

    var newRow = lastRow + 1;
    var tanggal = data.tanggal || Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd MMM yyyy · HH:mm');

    sheet.getRange(newRow, 1, 1, 7).setValues([[
      no,
      tanggal,
      data.nama || '-',
      data.phone || '-',
      data.email || '-',
      data.topik || '-',
      data.pesan || '-'
    ]]);

    // ── Style new row ──
    var rowRange = sheet.getRange(newRow, 1, 1, 7);
    rowRange.setVerticalAlignment('top');
    rowRange.setFontFamily('Inter');
    rowRange.setFontSize(10);

    // No — center, muted
    sheet.getRange(newRow, 1).setHorizontalAlignment('center').setFontColor('#5d7281');
    // Tanggal — center, mono
    sheet.getRange(newRow, 2).setHorizontalAlignment('center').setFontFamily('JetBrains Mono').setFontSize(9).setFontColor('#5d7281');
    // Nama — bold
    sheet.getRange(newRow, 3).setFontWeight('bold');
    // WhatsApp — mono
    sheet.getRange(newRow, 4).setFontFamily('JetBrains Mono').setFontSize(9);
    // Email — aqua
    sheet.getRange(newRow, 5).setFontColor('#0891b2');
    // Topik — bold teal
    sheet.getRange(newRow, 6).setFontWeight('bold').setFontColor('#0e7c8c');
    // Pesan — wrap, smaller
    sheet.getRange(newRow, 7).setFontSize(9).setWrap(true);

    // Alternating bg
    if (no % 2 === 0) {
      rowRange.setBackground('#f0f7f9');
    }

    // Bottom border
    rowRange.setBorder(false, false, true, false, false, false, '#dde8ec', SpreadsheetApp.BorderStyle.SOLID);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', row: no }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Sedekah Air Minum API aktif' }))
    .setMimeType(ContentService.MimeType.JSON);
}
