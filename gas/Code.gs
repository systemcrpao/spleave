/**
 * =====================================================================
 *  Leave Management System — Google Apps Script (GAS) Backend
 *  ระบบบริหารจัดการการลา — องค์การบริหารส่วนจังหวัดเชียงราย
 * =====================================================================
 *
 *  วิธีนำไปใช้งาน:
 *  1. เปิด Google Sheets ที่ต้องการใช้เป็นฐานข้อมูล
 *  2. ไปที่เมนู "ส่วนขยาย" > "Apps Script"
 *  3. ลบโค้ดเดิมทั้งหมด แล้ว copy โค้ดนี้วางแทน
 *  4. แก้ไข SPREADSHEET_ID ให้ตรงกับ ID ของ Google Sheets
 *  5. กด Deploy > New deployment > Web app
 *     - Execute as: Me
 *     - Who has access: Anyone
 *  6. Copy URL ที่ได้ไปใส่ใน VITE_GAS_URL ใน .env.local
 *
 *  โครงสร้าง Google Sheets (ต้องสร้าง Sheet เหล่านี้ก่อน):
 *  - Users          : ข้อมูลผู้ใช้งาน
 *  - LeaveQuotas    : โควต้าวันลา
 *  - LeaveRequests  : คำขอลา
 * =====================================================================
 */

// ─── ตั้งค่า ────────────────────────────────────────────────────────────────
// ↓↓↓ แก้ไขค่า SPREADSHEET_ID ให้ตรงกับ Google Sheets ของคุณ ↓↓↓
// วิธีดู ID: เปิด Google Sheets → ดูใน URL
// https://docs.google.com/spreadsheets/d/<<< ID อยู่ตรงนี้ >>>/edit
const SPREADSHEET_ID = "1aQIwtz-dX6Xr4oknxnPmoQIcZbJVUPJIx2zNXqmOaZU"; // ← ใส่ ID จริงตรงนี้
const SS = SpreadsheetApp.openById(SPREADSHEET_ID);

/** ปีงบประมาณปัจจุบัน (พ.ศ.) */
const CURRENT_FISCAL_YEAR = 2569;

// ─── CORS Headers ──────────────────────────────────────────────────────────
function setCorsHeaders(output) {
  return output
    .setHeader("Access-Control-Allow-Origin", "*")
    .setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    .setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// ─── Response Helpers ──────────────────────────────────────────────────────
function success(data) {
  const output = ContentService.createTextOutput(
    JSON.stringify({ status: "success", data }),
  ).setMimeType(ContentService.MimeType.JSON);
  return setCorsHeaders(output);
}

function error(message) {
  const output = ContentService.createTextOutput(
    JSON.stringify({ status: "error", message }),
  ).setMimeType(ContentService.MimeType.JSON);
  return setCorsHeaders(output);
}

// ─── Entry Points ──────────────────────────────────────────────────────────
function doGet(e) {
  try {
    const action = e.parameter.action;
    const params = e.parameter;
    return routeAction(action, params, null);
  } catch (err) {
    return error(err.message);
  }
}

function doPost(e) {
  try {
    const action = e.parameter.action;
    const params = e.parameter;
    const payload = e.postData?.contents ? JSON.parse(e.postData.contents) : {};
    return routeAction(action, params, payload);
  } catch (err) {
    return error(err.message);
  }
}

function routeAction(action, params, payload) {
  switch (action) {
    // ── Common ──────────────────────────────────────────────────────
    case "getUserProfile":
      return getUserProfile(params.uid);
    case "getLeaveQuota":
      return getLeaveQuota(params.uid);
    case "getLeaveHistory":
      return getLeaveHistory(params.uid, params.fiscalYear);
    case "submitLeaveRequest":
      return submitLeaveRequest(payload);

    // ── Officer ─────────────────────────────────────────────────────
    case "getPendingRegistrations":
      return getPendingRegistrations();
    case "processRegistration":
      return processRegistration(payload);
    case "getPendingVerifications":
      return getPendingVerifications();
    case "verifyLeaveRequest":
      return verifyLeaveRequest(payload);
    case "getOrgReport":
      return getOrgReport(params.fiscalYear);

    // ── Executive ───────────────────────────────────────────────────
    case "getExecDashboard":
      return getExecDashboard();
    case "getPendingApprovals":
      return getPendingApprovals();
    case "approveLeaveRequest":
      return approveLeaveRequest(payload);

    default:
      return error(`Unknown action: ${action}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  COMMON — ใช้ได้ทุก Role
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ดึงข้อมูลโปรไฟล์ผู้ใช้จาก Sheet "Users"
 * Columns: UID | Name | Position | Department | Role | Status | RegisteredAt
 */
function getUserProfile(uid) {
  if (!uid) return error("uid is required");

  const sheet = SS.getSheetByName("Users");
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === uid) {
      const row = rows[i];
      const status = row[5]; // "Active" | "Pending" | "Rejected"
      return success({
        uid: row[0],
        name: row[1],
        position: row[2],
        department: row[3],
        role: row[4],
        status: status, // ← เพิ่ม: 'Active' | 'Pending'
        isActive: status === "Active",
        registeredAt: row[6]
          ? Utilities.formatDate(new Date(row[6]), "Asia/Bangkok", "yyyy-MM-dd")
          : null,
      });
    }
  }

  // ผู้ใช้ใหม่ — ยังไม่มีในระบบ → สร้างรายการ Pending อัตโนมัติ
  const now = new Date();
  sheet.appendRow([
    uid,
    "",
    "",
    "",
    "User",
    "Pending",
    Utilities.formatDate(now, "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss"),
  ]);
  return success({
    uid,
    name: "",
    position: "",
    department: "",
    role: "User",
    status: "Pending", // ← เพิ่ม
    isActive: false,
  });
}

/**
 * ดึงโควต้าวันลาของผู้ใช้ ในปีงบประมาณที่ระบุ
 * Sheet "LeaveQuotas": UID | FiscalYear | SickTotal | SickUsed | PersonalTotal | PersonalUsed | VacationTotal | VacationUsed
 */
function getLeaveQuota(uid) {
  if (!uid) return error("uid is required");

  const sheet = SS.getSheetByName("LeaveQuotas");
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    const [rowUid, rowYear, sickT, sickU, perT, perU, vacT, vacU] = rows[i];
    if (rowUid === uid && Number(rowYear) === CURRENT_FISCAL_YEAR) {
      return success({
        fiscalYear: Number(rowYear),
        sickTotal: Number(sickT),
        sickUsed: Number(sickU),
        personalTotal: Number(perT),
        personalUsed: Number(perU),
        vacationTotal: Number(vacT),
        vacationUsed: Number(vacU),
      });
    }
  }

  // ค่าเริ่มต้นหากยังไม่มีข้อมูล
  return success({
    fiscalYear: CURRENT_FISCAL_YEAR,
    sickTotal: 0,
    sickUsed: 0,
    personalTotal: 0,
    personalUsed: 0,
    vacationTotal: 0,
    vacationUsed: 0,
  });
}

/**
 * ดึงประวัติการลาของผู้ใช้
 * Sheet "LeaveRequests": ID | UID | Name | Department | Position | LeaveType | StartDate | EndDate | TotalDays | Reason | CertUrl | Status | OfficerNote | ApproverNote | SubmittedAt | UpdatedAt
 */
function getLeaveHistory(uid, fiscalYear) {
  if (!uid) return error("uid is required");

  const sheet = SS.getSheetByName("LeaveRequests");
  const rows = sheet.getDataRange().getValues();
  const result = [];

  for (let i = 1; i < rows.length; i++) {
    const [
      id,
      rowUid,
      name,
      dept,
      pos,
      leaveType,
      startDate,
      endDate,
      totalDays,
      reason,
      certUrl,
      status,
      officerNote,
      approverNote,
      submittedAt,
    ] = rows[i];
    if (rowUid !== uid) continue;

    result.push({
      id: id,
      leaveType: leaveType,
      startDate: formatDateStr(startDate),
      endDate: formatDateStr(endDate),
      totalDays: Number(totalDays),
      reason: reason,
      certUrl: certUrl || null,
      status: status,
      officerNote: officerNote || null,
      approverNote: approverNote || null,
      submittedAt: submittedAt
        ? Utilities.formatDate(
            new Date(submittedAt),
            "Asia/Bangkok",
            "yyyy-MM-dd HH:mm",
          )
        : null,
    });
  }

  // เรียงจากใหม่ไปเก่า
  result.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  return success(result);
}

/**
 * ยื่นคำขอลาใหม่
 * payload: { uid, name, department, leaveType, startDate, endDate, totalDays, reason, certBase64, certFileName }
 */
function submitLeaveRequest(payload) {
  const required = [
    "uid",
    "leaveType",
    "startDate",
    "endDate",
    "totalDays",
    "reason",
  ];
  for (const key of required) {
    if (!payload[key]) return error(`${key} is required`);
  }

  const sheet = SS.getSheetByName("LeaveRequests");
  const now = Utilities.formatDate(
    new Date(),
    "Asia/Bangkok",
    "yyyy-MM-dd HH:mm:ss",
  );
  const id = `LR-${Date.now()}`;

  // อัปโหลดใบรับรองแพทย์ไปยัง Google Drive (ถ้ามี)
  let certUrl = "";
  if (payload.certBase64 && payload.certFileName) {
    certUrl = uploadFileToDrive(
      payload.certBase64,
      payload.certFileName,
      payload.uid,
    );
  }

  // ดึงข้อมูลชื่อ/ฝ่าย จาก Users sheet (ในกรณีที่ payload ไม่มี)
  let name = payload.name || "";
  let department = payload.department || "";
  let position = "";

  if (!name) {
    const userResult = getUserProfileRaw(payload.uid);
    if (userResult) {
      name = userResult.name;
      department = userResult.department;
      position = userResult.position;
    }
  }

  sheet.appendRow([
    id,
    payload.uid,
    name,
    department,
    position,
    payload.leaveType,
    payload.startDate,
    payload.endDate,
    payload.totalDays,
    payload.reason,
    certUrl,
    "Pending", // สถานะเริ่มต้น
    "", // officerNote
    "", // approverNote
    now, // submittedAt
    now, // updatedAt
  ]);

  return success({ id, message: "ยื่นคำขอลาเรียบร้อยแล้ว" });
}

// ═══════════════════════════════════════════════════════════════════════════
//  OFFICER — เจ้าหน้าที่เท่านั้น
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ดึงรายชื่อผู้ใช้ที่รอการอนุมัติ (Status = 'Pending')
 */
function getPendingRegistrations() {
  const sheet = SS.getSheetByName("Users");
  const rows = sheet.getDataRange().getValues();
  const result = [];

  for (let i = 1; i < rows.length; i++) {
    const [uid, name, position, department, role, status, registeredAt] =
      rows[i];
    if (status === "Pending") {
      result.push({
        uid,
        name,
        position,
        department,
        role,
        registeredAt: formatDateStr(registeredAt),
      });
    }
  }

  return success(result);
}

/**
 * อนุมัติหรือปฏิเสธผู้ใช้งานใหม่
 * payload: { uid, action: 'approve'|'reject', sickTotal, personalTotal, vacationTotal, note }
 */
function processRegistration(payload) {
  const { uid, action, note } = payload;
  if (!uid || !action) return error("uid and action are required");

  const userSheet = SS.getSheetByName("Users");
  const rows = userSheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === uid) {
      const rowNum = i + 1;
      if (action === "approve") {
        userSheet.getRange(rowNum, 6).setValue("Active"); // Status column

        // สร้างโควต้าเริ่มต้นใน LeaveQuotas
        const quotaSheet = SS.getSheetByName("LeaveQuotas");
        quotaSheet.appendRow([
          uid,
          CURRENT_FISCAL_YEAR,
          payload.sickTotal || 30,
          0,
          payload.personalTotal || 6,
          0,
          payload.vacationTotal || 10,
          0,
        ]);
      } else if (action === "reject") {
        userSheet.getRange(rowNum, 6).setValue("Rejected");
      }
      return success({
        message: action === "approve" ? "อนุมัติเรียบร้อย" : "ปฏิเสธเรียบร้อย",
      });
    }
  }

  return error("ไม่พบผู้ใช้งาน");
}

/**
 * ดึงรายการคำขอลาที่รอการตรวจสอบ (Status = 'Pending')
 */
function getPendingVerifications() {
  return getLeaveRequestsByStatus("Pending");
}

/**
 * ตรวจสอบและส่งต่อ หรือปฏิเสธคำขอลา (เจ้าหน้าที่)
 * payload: { requestId, action: 'verify'|'reject', note }
 */
function verifyLeaveRequest(payload) {
  const { requestId, action, note } = payload;
  if (!requestId || !action) return error("requestId and action are required");

  const newStatus = action === "verify" ? "Verified" : "Rejected";
  updateLeaveRequest(requestId, { status: newStatus, officerNote: note || "" });

  return success({
    message: action === "verify" ? "ส่งต่อผู้บริหารแล้ว" : "ปฏิเสธใบลาแล้ว",
  });
}

/**
 * รายงานภาพรวมการลาของบุคลากรทั้งหมด
 */
function getOrgReport(fiscalYear) {
  const fy = Number(fiscalYear) || CURRENT_FISCAL_YEAR;

  const userSheet = SS.getSheetByName("Users");
  const leaveSheet = SS.getSheetByName("LeaveRequests");
  const quotaSheet = SS.getSheetByName("LeaveQuotas");

  const users = userSheet
    .getDataRange()
    .getValues()
    .slice(1)
    .filter((r) => r[5] === "Active");
  const leaves = leaveSheet.getDataRange().getValues().slice(1);
  const quotas = quotaSheet
    .getDataRange()
    .getValues()
    .slice(1)
    .filter((r) => Number(r[1]) === fy);

  // สรุปรายบุคคล
  const rows = users.map(([uid, name, position, department]) => {
    const userLeaves = leaves.filter(
      (r) => r[1] === uid && r[11] === "Approved",
    );
    const sick = userLeaves
      .filter((r) => r[5] === "ลาป่วย")
      .reduce((s, r) => s + Number(r[8]), 0);
    const personal = userLeaves
      .filter((r) => r[5] === "ลากิจ")
      .reduce((s, r) => s + Number(r[8]), 0);
    const vacation = userLeaves
      .filter((r) => r[5] === "ลาพักผ่อน")
      .reduce((s, r) => s + Number(r[8]), 0);
    return { uid, name, position, department, sick, personal, vacation };
  });

  const allLeaves = leaves.filter((r) => r[11] !== "Cancelled");
  const summary = {
    totalStaff: users.length,
    totalRequests: allLeaves.length,
    totalApproved: allLeaves.filter((r) => r[11] === "Approved").length,
    totalPending: allLeaves.filter((r) =>
      ["Pending", "Verified"].includes(r[11]),
    ).length,
  };

  return success({ fiscalYear: fy, summary, rows });
}

// ═══════════════════════════════════════════════════════════════════════════
//  EXECUTIVE — ผู้บริหารเท่านั้น
// ═══════════════════════════════════════════════════════════════════════════

/**
 * กระดานผู้บริหาร: ใครลาวันนี้บ้าง
 */
function getExecDashboard() {
  const today = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd");

  const userSheet = SS.getSheetByName("Users");
  const leaveSheet = SS.getSheetByName("LeaveRequests");

  const users = userSheet
    .getDataRange()
    .getValues()
    .slice(1)
    .filter((r) => r[5] === "Active");
  const leaves = leaveSheet.getDataRange().getValues().slice(1);

  // คนที่ลาวันนี้
  const absentList = [];
  leaves.forEach(
    ([
      id,
      uid,
      name,
      department,
      position,
      leaveType,
      startDate,
      endDate,
      totalDays,
      reason,
      certUrl,
      status,
    ]) => {
      if (status !== "Approved") return;
      const start = formatDateStr(startDate);
      const end = formatDateStr(endDate);
      if (today >= start && today <= end) {
        absentList.push({
          uid,
          name,
          department,
          position,
          leaveType,
          startDate: start,
          endDate: end,
        });
      }
    },
  );

  // แยกตามฝ่ายงาน
  const deptMap = {};
  users.forEach(([uid, , , department]) => {
    if (!deptMap[department])
      deptMap[department] = { name: department, total: 0, absent: 0 };
    deptMap[department].total++;
  });
  absentList.forEach(({ department }) => {
    if (deptMap[department]) deptMap[department].absent++;
  });

  const pendingLeaves = leaves.filter((r) =>
    ["Pending", "Verified"].includes(r[11]),
  );

  return success({
    today,
    summary: {
      totalStaff: users.length,
      absentToday: absentList.length,
      pendingApprovals: pendingLeaves.length,
    },
    departments: Object.values(deptMap),
    absentList,
  });
}

/**
 * ดึงรายการที่รอการอนุมัติขั้นสุดท้าย (Status = 'Verified')
 */
function getPendingApprovals() {
  return getLeaveRequestsByStatus("Verified");
}

/**
 * อนุมัติหรือปฏิเสธคำขอลา (ผู้บริหาร)
 * payload: { requestId, action: 'approve'|'reject', note }
 */
function approveLeaveRequest(payload) {
  const { requestId, action, note } = payload;
  if (!requestId || !action) return error("requestId and action are required");

  const newStatus = action === "approve" ? "Approved" : "Rejected";
  const row = updateLeaveRequest(requestId, {
    status: newStatus,
    approverNote: note || "",
  });

  // อัปเดต LeaveQuotas เมื่ออนุมัติ
  if (action === "approve" && row) {
    const [id, uid, , , , leaveType, , , totalDays] = row;
    updateLeaveQuotaUsed(uid, leaveType, Number(totalDays));
  }

  return success({
    message:
      action === "approve" ? "อนุมัติการลาเรียบร้อย" : "ปฏิเสธการลาเรียบร้อย",
  });
}

// ═══════════════════════════════════════════════════════════════════════════
//  INTERNAL HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/** ดึงข้อมูลผู้ใช้เป็น object (ใช้ภายใน) */
function getUserProfileRaw(uid) {
  const sheet = SS.getSheetByName("Users");
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === uid) {
      return {
        uid: rows[i][0],
        name: rows[i][1],
        position: rows[i][2],
        department: rows[i][3],
      };
    }
  }
  return null;
}

/** ดึง LeaveRequests ตาม status */
function getLeaveRequestsByStatus(status) {
  const sheet = SS.getSheetByName("LeaveRequests");
  const rows = sheet.getDataRange().getValues();
  const result = [];

  for (let i = 1; i < rows.length; i++) {
    const [
      id,
      uid,
      name,
      department,
      position,
      leaveType,
      startDate,
      endDate,
      totalDays,
      reason,
      certUrl,
      rowStatus,
      officerNote,
      approverNote,
      submittedAt,
    ] = rows[i];
    if (rowStatus !== status) continue;
    result.push({
      id,
      uid,
      name,
      department,
      position,
      leaveType,
      startDate: formatDateStr(startDate),
      endDate: formatDateStr(endDate),
      totalDays: Number(totalDays),
      reason,
      certUrl: certUrl || null,
      status: rowStatus,
      officerNote: officerNote || null,
      approverNote: approverNote || null,
      submittedAt: submittedAt
        ? Utilities.formatDate(
            new Date(submittedAt),
            "Asia/Bangkok",
            "yyyy-MM-dd HH:mm",
          )
        : null,
    });
  }

  result.sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));
  return success(result);
}

/** อัปเดต LeaveRequests row ตาม id → คืนค่า row data */
function updateLeaveRequest(requestId, updates) {
  const sheet = SS.getSheetByName("LeaveRequests");
  const rows = sheet.getDataRange().getValues();
  const now = Utilities.formatDate(
    new Date(),
    "Asia/Bangkok",
    "yyyy-MM-dd HH:mm:ss",
  );

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === requestId) {
      const rowNum = i + 1;
      if (updates.status) sheet.getRange(rowNum, 12).setValue(updates.status);
      if (updates.officerNote !== undefined)
        sheet.getRange(rowNum, 13).setValue(updates.officerNote);
      if (updates.approverNote !== undefined)
        sheet.getRange(rowNum, 14).setValue(updates.approverNote);
      sheet.getRange(rowNum, 16).setValue(now); // updatedAt
      return rows[i];
    }
  }
  return null;
}

/** อัปเดตวันลาที่ใช้ไปใน LeaveQuotas */
function updateLeaveQuotaUsed(uid, leaveType, days) {
  const sheet = SS.getSheetByName("LeaveQuotas");
  const rows = sheet.getDataRange().getValues();

  const colMap = { ลาป่วย: 4, ลากิจ: 6, ลาพักผ่อน: 8 };
  const col = colMap[leaveType];
  if (!col) return;

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === uid && Number(rows[i][1]) === CURRENT_FISCAL_YEAR) {
      const current = Number(rows[i][col - 1]) || 0;
      sheet.getRange(i + 1, col).setValue(current + days);
      return;
    }
  }
}

/** อัปโหลดไฟล์ไปยัง Google Drive และคืน URL */
function uploadFileToDrive(base64Data, fileName, uid) {
  try {
    const folder = getOrCreateFolder("LeaveDocuments/" + uid);
    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64Data),
      "application/octet-stream",
      fileName,
    );
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (err) {
    Logger.log("uploadFileToDrive error: " + err.message);
    return "";
  }
}

/** สร้างหรือดึง folder ใน Google Drive */
function getOrCreateFolder(path) {
  const parts = path.split("/");
  let folder = DriveApp.getRootFolder();
  for (const part of parts) {
    const existing = folder.getFoldersByName(part);
    folder = existing.hasNext() ? existing.next() : folder.createFolder(part);
  }
  return folder;
}

/** แปลง Date object → string 'yyyy-MM-dd' */
function formatDateStr(dateVal) {
  if (!dateVal) return "";
  try {
    return Utilities.formatDate(
      new Date(dateVal),
      "Asia/Bangkok",
      "yyyy-MM-dd",
    );
  } catch {
    return String(dateVal);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  SETUP — รันครั้งแรกเพื่อสร้างโครงสร้าง Sheets
// ═══════════════════════════════════════════════════════════════════════════

/**
 * รันฟังก์ชันนี้ครั้งเดียวเพื่อสร้าง Sheet headers ทั้งหมดโดยอัตโนมัติ
 * ไปที่ Apps Script Editor → เลือก setupSheets → กด Run
 */
function setupSheets() {
  // ── Users ────────────────────────────────────────────────────────────────
  let sheet = SS.getSheetByName("Users") || SS.insertSheet("Users");
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "UID",
      "Name",
      "Position",
      "Department",
      "Role",
      "Status",
      "RegisteredAt",
    ]);
    sheet
      .getRange(1, 1, 1, 7)
      .setFontWeight("bold")
      .setBackground("#4472C4")
      .setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
    // ข้อมูลตัวอย่าง
    sheet.appendRow([
      "U_DEV_000000000000000000000000000",
      "ทดสอบ ระบบ",
      "นักวิชาการคอมพิวเตอร์",
      "ฝ่ายพัฒนาระบบ",
      "Officer",
      "Active",
      new Date(),
    ]);
  }

  // ── LeaveQuotas ──────────────────────────────────────────────────────────
  sheet = SS.getSheetByName("LeaveQuotas") || SS.insertSheet("LeaveQuotas");
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "UID",
      "FiscalYear",
      "SickTotal",
      "SickUsed",
      "PersonalTotal",
      "PersonalUsed",
      "VacationTotal",
      "VacationUsed",
    ]);
    sheet
      .getRange(1, 1, 1, 8)
      .setFontWeight("bold")
      .setBackground("#4472C4")
      .setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
    // โควต้าตัวอย่างสำหรับ DEV user
    sheet.appendRow([
      "U_DEV_000000000000000000000000000",
      2569,
      30,
      3,
      6,
      1,
      10,
      2,
    ]);
  }

  // ── LeaveRequests ────────────────────────────────────────────────────────
  sheet = SS.getSheetByName("LeaveRequests") || SS.insertSheet("LeaveRequests");
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "ID",
      "UID",
      "Name",
      "Department",
      "Position",
      "LeaveType",
      "StartDate",
      "EndDate",
      "TotalDays",
      "Reason",
      "CertUrl",
      "Status",
      "OfficerNote",
      "ApproverNote",
      "SubmittedAt",
      "UpdatedAt",
    ]);
    sheet
      .getRange(1, 1, 1, 16)
      .setFontWeight("bold")
      .setBackground("#4472C4")
      .setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
  }

  Logger.log(
    "✅ setupSheets เสร็จสมบูรณ์! สร้าง Sheets: Users, LeaveQuotas, LeaveRequests",
  );
  SpreadsheetApp.getUi().alert(
    "✅ สร้างโครงสร้าง Google Sheets เรียบร้อยแล้ว!\nกรุณา Deploy เป็น Web App ต่อไป",
  );
}
