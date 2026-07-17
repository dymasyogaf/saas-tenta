// ====================================================================
// SCRIPT WEBHOOK GOOGLE SHEET - TENTAKLIK eKYC (V2 DENGAN UPLOAD FOTO)
// ====================================================================
// CARA INSTALL:
// 1. Hapus semua kode lama, paste kode ini.
// 2. Wajib Jalankan fungsi setup() dulu!: Di menu atas ada dropdown fungsi, pilih "setup", lalu klik tombol "Jalankan". (Ini akan otomatis membuat tabel orange & rapi).
// 3. Jika diminta izin akses Google Drive, setujui semuanya.
// 4. Klik "Terapkan" (Deploy) > "Kelola Penerapan" (Manage Deployments).
// 5. Klik ikon pensil (Edit), lalu di dropdown Versi, pilih "Versi Baru" (New Version). Wajib "Versi Baru"!
// 6. Pastikan "Jalankan sebagai: Saya" dan "Yang memiliki akses: Siapa saja".
// 7. Simpan, dan URL Webhook tidak akan berubah.
// ====================================================================

const SHEET_NAME = 'Data Member Tenta';
const FOLDER_NAME = 'eKYC Tentaklik Uploads';

// FUNGSI INI WAJIB DIJALANKAN SEKALI MANUAL DARI EDITOR UNTUK MEMBUAT TABEL
function setup() {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = doc.getSheetByName(SHEET_NAME);
  
  // Jika sheet belum ada, buat baru. Jika "Sheet1" kosong, ubah namanya.
  if (!sheet) {
    let sheet1 = doc.getSheetByName('Sheet1');
    if (sheet1 && sheet1.getLastRow() === 0) {
      sheet1.setName(SHEET_NAME);
      sheet = sheet1;
    } else {
      sheet = doc.insertSheet(SHEET_NAME);
    }
  }
  
  // Set header tabel
  const headers = ['No', 'Waktu Masuk', 'Nama Lengkap', 'NIK', 'Tanggal Lahir', 'Email', 'Nomor WhatsApp', 'Status Verifikasi', 'File KTP', 'Pas Photo'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Mewarnai header dengan warna Orange Khas Tenta
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#F97316'); // Orange
  headerRange.setFontColor('#FFFFFF');  // Teks Putih
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  // Freeze baris pertama agar tidak ikut ter-scroll
  sheet.setFrozenRows(1);
  
  // Otomatis menyesuaikan lebar kolom
  sheet.autoResizeColumns(1, headers.length);
}

// Fungsi pembantu untuk membuat/mencari folder di Google Drive
function getOrCreateFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return DriveApp.createFolder(folderName);
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Tidak ada data JSON' })).setMimeType(ContentService.MimeType.JSON);
    }

    const payload = JSON.parse(e.postData.contents);
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = doc.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Tabel tidak ditemukan. Jalankan fungsi setup() dulu.' })).setMimeType(ContentService.MimeType.JSON);
    }
    
    let ktpUrl = '-';
    let pasphotoUrl = '-';
    
    // Proses upload gambar ke Google Drive
    try {
      const folder = getOrCreateFolder(FOLDER_NAME);
      
      if (payload.ktp_base64) {
        const ktpBlob = Utilities.newBlob(Utilities.base64Decode(payload.ktp_base64), payload.ktp_mime, payload.nik + '_KTP_' + payload.ktp_name);
        const ktpFile = folder.createFile(ktpBlob);
        ktpFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        ktpUrl = ktpFile.getUrl();
      }
      
      if (payload.pasphoto_base64) {
        const pasphotoBlob = Utilities.newBlob(Utilities.base64Decode(payload.pasphoto_base64), payload.pasphoto_mime, payload.nik + '_PASPHOTO_' + payload.pasphoto_name);
        const pasphotoFile = folder.createFile(pasphotoBlob);
        pasphotoFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        pasphotoUrl = pasphotoFile.getUrl();
      }
    } catch (err) {
      ktpUrl = 'Gagal upload: ' + err.toString();
      pasphotoUrl = 'Gagal upload';
    }

    // Kalkulasi Nomor Urut
    const lastRow = sheet.getLastRow();
    const nomorUrut = lastRow === 0 ? 1 : lastRow; 
    
    const rowData = [
      nomorUrut,
      new Date(),
      payload.nama || '-',
      "'" + String(payload.nik), // Kutip satu di awal agar NIK tidak berubah jadi rumus/eksponen
      payload.tanggal_lahir || '-',
      payload.email || '-',
      "'" + String(payload.no_hp), // Sama untuk nomor HP
      'Menunggu Review',
      ktpUrl,
      pasphotoUrl
    ];
    
    sheet.appendRow(rowData);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Data berhasil disimpan!'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
