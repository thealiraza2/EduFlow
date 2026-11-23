/**
 * EduFlow - PDF Generation Module
 * Generates official 3-copy Fee Challans and Student Result Cards using pdf-lib.
 *
 * All amounts are formatted from integer minor units (paisa).
 */

import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from "pdf-lib";

/** Rounded-rectangle SVG path in the mark's 32-unit grid. */
function roundedRectPath(x: number, y: number, w: number, h: number, r: number) {
  return `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
}

/**
 * Draws the EduFlow mark (vector) with its top-left corner at (x, yTop).
 * Same geometry as components/brand/Logo.tsx.
 */
function drawEduFlowMark(page: PDFPage, x: number, yTop: number, size: number) {
  const s = size / 32;
  const white = rgb(1, 1, 1);
  page.drawSvgPath(roundedRectPath(0, 0, 32, 32, 9), { x, y: yTop, scale: s, color: rgb(0.17, 0.25, 0.82) });
  page.drawSvgPath(roundedRectPath(9.5, 8.5, 12.5, 3.2, 1.6), { x, y: yTop, scale: s, color: white });
  page.drawSvgPath(roundedRectPath(9.5, 14.4, 8.5, 3.2, 1.6), { x, y: yTop, scale: s, color: white, opacity: 0.72 });
  page.drawSvgPath(roundedRectPath(9.5, 20.3, 12.5, 3.2, 1.6), { x, y: yTop, scale: s, color: white });
  page.drawCircle({ x: x + 22.2 * s, y: yTop - 16 * s, size: 2.1 * s, color: rgb(1, 0.42, 0.46) });
}

/** Small centred "Generated with EduFlow" line with the mark, at baseline y. */
function drawPoweredBy(page: PDFPage, font: PDFFont, boldFont: PDFFont, centerX: number, y: number) {
  const size = 7;
  const lead = "Generated with ";
  const name = "EduFlow";
  const markSize = 9;
  const gap = 3;
  const total = markSize + gap + font.widthOfTextAtSize(lead, size) + boldFont.widthOfTextAtSize(name, size);
  let x = centerX - total / 2;
  drawEduFlowMark(page, x, y + markSize - 1.5, markSize);
  x += markSize + gap;
  page.drawText(lead, { x, y, size, font, color: rgb(0.45, 0.48, 0.56) });
  x += font.widthOfTextAtSize(lead, size);
  page.drawText(name, { x, y, size, font: boldFont, color: rgb(0.15, 0.26, 0.84) });
}
import { formatPKR, Paisa } from "./money";

export interface ChallanData {
  challanNo: string;
  academyName: string;
  studentName: string;
  admissionNo: string;
  className: string;
  batchName: string;
  month: string;
  monthlyFeeMinor: Paisa;
  lateFineMinor: Paisa;
  discountMinor: Paisa;
  totalMinor: Paisa;
  paidMinor: Paisa;
  remainingMinor: Paisa;
  status: "UNPAID" | "PARTIAL" | "PAID";
  dueDate: string;
  issueDate?: string;
  bankDetails?: {
    bankName: string;
    accountTitle: string;
    accountNumber: string;
    jazzCashAccount: string;
    easyPaisaAccount: string;
  };
}

const DEFAULT_BANK_DETAILS = {
  bankName: "Habib Bank Limited (HBL)",
  accountTitle: "EduFlow Education Services",
  accountNumber: "2345-78901234-03",
  jazzCashAccount: "0300-1234567 (Till: 98765)",
  easyPaisaAccount: "0300-1234567",
};

/**
 * Generates a standard Pakistani 3-copy Fee Challan PDF
 * Layout: A4 Landscape (841.89 x 595.28 pt) with 3 equal columns:
 * 1. Bank Copy  2. Academy Copy  3. Student/Parent Copy
 */
export async function generateFeeChallanPdf(data: ChallanData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  // A4 Landscape: width = 841.89 pt, height = 595.28 pt
  const page = pdfDoc.addPage([841.89, 595.28]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  const bankDetails = data.bankDetails || DEFAULT_BANK_DETAILS;
  const issueDate = data.issueDate || new Date().toISOString().split("T")[0];

  const copies = [
    { title: "BANK / MERCHANT COPY", subtitle: "To be retained by bank or merchant" },
    { title: "ACADEMY COPY", subtitle: "To be submitted to academy accounts" },
    { title: "STUDENT / PARENT COPY", subtitle: "To be retained by student/parent" },
  ];

  const colWidth = 255;
  const colGap = 20;
  const startX = 28;

  // Draw 3 columns
  copies.forEach((copy, index) => {
    const x = startX + index * (colWidth + colGap);
    let y = height - 35;

    // Header: Academy Name
    page.drawText(data.academyName, {
      x,
      y,
      size: 11,
      font: boldFont,
      color: rgb(0.08, 0.12, 0.2),
    });
    y -= 14;

    // Challan Badge
    page.drawText("FEE CHALLAN", {
      x,
      y,
      size: 10,
      font: boldFont,
      color: rgb(0.12, 0.35, 0.7),
    });

    // Copy Type Tag
    page.drawText(`[ ${copy.title} ]`, {
      x: x + 90,
      y,
      size: 8,
      font: boldFont,
      color: rgb(0.4, 0.4, 0.4),
    });
    y -= 12;

    // Horizontal Rule
    page.drawLine({
      start: { x, y },
      end: { x: x + colWidth, y },
      thickness: 1,
      color: rgb(0.8, 0.85, 0.9),
    });
    y -= 14;

    // Challan Metadata
    const meta = [
      `Challan No: ${data.challanNo}`,
      `Billing Month: ${data.month}`,
      `Issue Date: ${issueDate}`,
      `Due Date: ${data.dueDate}`,
    ];

    meta.forEach((line) => {
      page.drawText(line, {
        x,
        y,
        size: 8,
        font: line.includes("Due Date") ? boldFont : font,
        color: line.includes("Due Date") ? rgb(0.8, 0.1, 0.1) : rgb(0.2, 0.2, 0.2),
      });
      y -= 11;
    });

    y -= 4;
    page.drawLine({
      start: { x, y },
      end: { x: x + colWidth, y },
      thickness: 0.5,
      color: rgb(0.85, 0.85, 0.85),
    });
    y -= 12;

    // Student Details
    page.drawText("STUDENT DETAILS", {
      x,
      y,
      size: 8.5,
      font: boldFont,
      color: rgb(0.2, 0.25, 0.35),
    });
    y -= 12;

    const studentInfo = [
      `Student Name: ${data.studentName}`,
      `Admission No: ${data.admissionNo}`,
      `Class / Batch: ${data.className} - ${data.batchName}`,
    ];

    studentInfo.forEach((line) => {
      page.drawText(line, {
        x,
        y,
        size: 8,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });
      y -= 11;
    });

    y -= 4;
    page.drawLine({
      start: { x, y },
      end: { x: x + colWidth, y },
      thickness: 0.5,
      color: rgb(0.85, 0.85, 0.85),
    });
    y -= 12;

    // Fee Breakdown Box
    page.drawText("FEE BREAKDOWN", {
      x,
      y,
      size: 8.5,
      font: boldFont,
      color: rgb(0.2, 0.25, 0.35),
    });
    y -= 12;

    const items = [
      { label: "Tuition Fee:", val: formatPKR(data.monthlyFeeMinor) },
      { label: "Late Fine:", val: formatPKR(data.lateFineMinor) },
      { label: "Discount:", val: `-${formatPKR(data.discountMinor)}` },
      { label: "Total Payable:", val: formatPKR(data.totalMinor), bold: true },
      { label: "Paid Amount:", val: formatPKR(data.paidMinor) },
      {
        label: "Remaining Balance:",
        val: formatPKR(data.remainingMinor),
        bold: true,
        highlight: true,
      },
    ];

    items.forEach((item) => {
      page.drawText(item.label, {
        x,
        y,
        size: 8,
        font: item.bold ? boldFont : font,
        color: item.highlight && data.remainingMinor > 0 ? rgb(0.75, 0.1, 0.1) : rgb(0.2, 0.2, 0.2),
      });

      page.drawText(item.val, {
        x: x + colWidth - 75,
        y,
        size: 8,
        font: item.bold ? boldFont : font,
        color: item.highlight && data.remainingMinor > 0 ? rgb(0.75, 0.1, 0.1) : rgb(0.1, 0.1, 0.1),
      });

      y -= 11;
    });

    // Status Tag
    y -= 2;
    page.drawText(`Status: ${data.status}`, {
      x,
      y,
      size: 8,
      font: boldFont,
      color:
        data.status === "PAID"
          ? rgb(0.1, 0.6, 0.2)
          : data.status === "PARTIAL"
          ? rgb(0.8, 0.45, 0.1)
          : rgb(0.7, 0.1, 0.1),
    });
    y -= 12;

    // Payment Methods Box
    page.drawRectangle({
      x,
      y: y - 52,
      width: colWidth,
      height: 52,
      color: rgb(0.96, 0.97, 0.99),
      borderColor: rgb(0.85, 0.88, 0.93),
      borderWidth: 0.5,
    });

    page.drawText("OFFICIAL PAYMENT CHANNELS:", {
      x: x + 6,
      y: y - 10,
      size: 7,
      font: boldFont,
      color: rgb(0.2, 0.25, 0.4),
    });

    page.drawText(`Bank: ${bankDetails.bankName}`, {
      x: x + 6,
      y: y - 20,
      size: 7,
      font,
      color: rgb(0.25, 0.25, 0.25),
    });

    page.drawText(`A/C: ${bankDetails.accountNumber}`, {
      x: x + 6,
      y: y - 29,
      size: 7,
      font,
      color: rgb(0.25, 0.25, 0.25),
    });

    page.drawText(`JazzCash / EasyPaisa: ${bankDetails.jazzCashAccount}`, {
      x: x + 6,
      y: y - 38,
      size: 7,
      font,
      color: rgb(0.25, 0.25, 0.25),
    });

    page.drawText("Title: " + bankDetails.accountTitle, {
      x: x + 6,
      y: y - 47,
      size: 6.5,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    y -= 64;

    // Instructions
    page.drawText("* Please submit payment on or before due date.", {
      x,
      y,
      size: 6.5,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
    y -= 8;
    page.drawText("* Fee once paid is non-refundable and non-transferable.", {
      x,
      y,
      size: 6.5,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
    y -= 24;

    // Signatures
    page.drawLine({
      start: { x: x + 15, y },
      end: { x: x + colWidth - 15, y },
      thickness: 0.5,
      color: rgb(0.6, 0.6, 0.6),
    });
    y -= 9;

    page.drawText("Authorized Officer / Bank Stamp & Signature", {
      x: x + 25,
      y,
      size: 7,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Draw dashed divider between copies
    if (index < 2) {
      const dividerX = x + colWidth + colGap / 2;
      for (let dy = 20; dy < height - 20; dy += 12) {
        page.drawLine({
          start: { x: dividerX, y: dy },
          end: { x: dividerX, y: dy + 6 },
          thickness: 0.8,
          color: rgb(0.7, 0.75, 0.8),
        });
      }
    }
  });

  drawPoweredBy(page, font, boldFont, width / 2, 8);

  return await pdfDoc.save();
}

export interface ResultCardData {
  academyName: string;
  studentName: string;
  admissionNo: string;
  className: string;
  batchName: string;
  testTitle: string;
  subject: string;
  testDate: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  classPosition: string; // e.g. "1st / 30"
  teacherRemarks?: string | null;
  correctionLog?: string | null;
}

/**
 * Generates an official A4 portrait Student Result Card PDF
 */
export async function generateResultCardPdf(data: ResultCardData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 Portrait in points
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  const margin = 45;
  let y = height - margin;

  // Outer decorative border
  page.drawRectangle({
    x: margin - 15,
    y: margin - 15,
    width: width - (margin - 15) * 2,
    height: height - (margin - 15) * 2,
    borderColor: rgb(0.12, 0.22, 0.4),
    borderWidth: 1.5,
  });

  // Inner border
  page.drawRectangle({
    x: margin - 10,
    y: margin - 10,
    width: width - (margin - 10) * 2,
    height: height - (margin - 10) * 2,
    borderColor: rgb(0.8, 0.85, 0.9),
    borderWidth: 0.5,
  });

  // 1. Academy Header
  y -= 15;
  page.drawText(data.academyName.toUpperCase(), {
    x: margin,
    y,
    size: 18,
    font: boldFont,
    color: rgb(0.08, 0.15, 0.35),
  });
  y -= 18;

  page.drawText("OFFICIAL STUDENT ASSESSMENT REPORT & RESULT CARD", {
    x: margin,
    y,
    size: 10,
    font: boldFont,
    color: rgb(0.3, 0.35, 0.45),
  });
  y -= 15;

  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 2,
    color: rgb(0.12, 0.22, 0.4),
  });
  y -= 25;

  // 2. Student & Test Profile Box
  page.drawRectangle({
    x: margin,
    y: y - 85,
    width: width - margin * 2,
    height: 95,
    color: rgb(0.97, 0.98, 1.0),
    borderColor: rgb(0.85, 0.88, 0.95),
    borderWidth: 1,
  });

  const leftX = margin + 15;
  const rightX = margin + 260;
  let profileY = y - 5;

  // Left column: Student Profile
  page.drawText("STUDENT DETAILS", {
    x: leftX,
    y: profileY,
    size: 9,
    font: boldFont,
    color: rgb(0.12, 0.22, 0.4),
  });
  profileY -= 16;

  page.drawText(`Student Name: ${data.studentName}`, {
    x: leftX,
    y: profileY,
    size: 9.5,
    font: boldFont,
    color: rgb(0.15, 0.15, 0.15),
  });
  profileY -= 15;

  page.drawText(`Admission / Roll No: ${data.admissionNo}`, {
    x: leftX,
    y: profileY,
    size: 9,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });
  profileY -= 15;

  page.drawText(`Class & Batch: ${data.className} (${data.batchName})`, {
    x: leftX,
    y: profileY,
    size: 9,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Right column: Test Details
  let testY = y - 5;
  page.drawText("EXAMINATION DETAILS", {
    x: rightX,
    y: testY,
    size: 9,
    font: boldFont,
    color: rgb(0.12, 0.22, 0.4),
  });
  testY -= 16;

  page.drawText(`Assessment: ${data.testTitle}`, {
    x: rightX,
    y: testY,
    size: 9.5,
    font: boldFont,
    color: rgb(0.15, 0.15, 0.15),
  });
  testY -= 15;

  page.drawText(`Subject: ${data.subject}`, {
    x: rightX,
    y: testY,
    size: 9,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });
  testY -= 15;

  page.drawText(`Test Date: ${data.testDate}`, {
    x: rightX,
    y: testY,
    size: 9,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });

  y -= 115;

  // 3. Performance Summary Cards (Score, Percentage, Grade, Position)
  const cardWidth = (width - margin * 2 - 30) / 4;
  const cards = [
    { title: "MARKS OBTAINED", value: `${data.obtainedMarks} / ${data.totalMarks}`, color: rgb(0.1, 0.15, 0.25) },
    { title: "PERCENTAGE", value: `${data.percentage}%`, color: rgb(0.12, 0.35, 0.7) },
    { title: "GRADE", value: data.grade, color: data.grade === "A+" || data.grade === "A" ? rgb(0.1, 0.6, 0.2) : data.grade === "F" ? rgb(0.8, 0.1, 0.1) : rgb(0.8, 0.5, 0.1) },
    { title: "CLASS POSITION", value: data.classPosition, color: rgb(0.7, 0.2, 0.1) },
  ];

  cards.forEach((card, i) => {
    const cardX = margin + i * (cardWidth + 10);
    page.drawRectangle({
      x: cardX,
      y: y - 55,
      width: cardWidth,
      height: 65,
      color: rgb(0.98, 0.99, 1.0),
      borderColor: rgb(0.85, 0.88, 0.93),
      borderWidth: 1,
    });

    page.drawText(card.title, {
      x: cardX + 8,
      y: y - 10,
      size: 7,
      font: boldFont,
      color: rgb(0.45, 0.5, 0.55),
    });

    page.drawText(card.value, {
      x: cardX + 8,
      y: y - 35,
      size: 15,
      font: boldFont,
      color: card.color,
    });
  });

  y -= 95;

  // 4. Performance Assessment Table / Breakdown
  page.drawText("ACADEMIC PERFORMANCE SUMMARY", {
    x: margin,
    y,
    size: 10,
    font: boldFont,
    color: rgb(0.12, 0.22, 0.4),
  });
  y -= 12;

  // Table header
  page.drawRectangle({
    x: margin,
    y: y - 16,
    width: width - margin * 2,
    height: 22,
    color: rgb(0.92, 0.94, 0.97),
  });

  page.drawText("Subject / Paper", { x: margin + 12, y: y - 8, size: 8.5, font: boldFont });
  page.drawText("Max Marks", { x: margin + 180, y: y - 8, size: 8.5, font: boldFont });
  page.drawText("Obtained Marks", { x: margin + 270, y: y - 8, size: 8.5, font: boldFont });
  page.drawText("Percentage", { x: margin + 370, y: y - 8, size: 8.5, font: boldFont });
  page.drawText("Grade", { x: margin + 450, y: y - 8, size: 8.5, font: boldFont });
  y -= 26;

  // Table row
  page.drawText(data.subject, { x: margin + 12, y: y - 4, size: 9, font });
  page.drawText(data.totalMarks.toString(), { x: margin + 180, y: y - 4, size: 9, font });
  page.drawText(data.obtainedMarks.toString(), { x: margin + 270, y: y - 4, size: 9, font: boldFont });
  page.drawText(`${data.percentage}%`, { x: margin + 370, y: y - 4, size: 9, font: boldFont });
  page.drawText(data.grade, { x: margin + 450, y: y - 4, size: 9, font: boldFont });
  y -= 15;

  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 0.5,
    color: rgb(0.85, 0.85, 0.85),
  });
  y -= 25;

  // 5. Teacher Remarks Box
  page.drawText("FACULTY REMARKS & FEEDBACK", {
    x: margin,
    y,
    size: 9.5,
    font: boldFont,
    color: rgb(0.12, 0.22, 0.4),
  });
  y -= 12;

  page.drawRectangle({
    x: margin,
    y: y - 45,
    width: width - margin * 2,
    height: 52,
    color: rgb(0.99, 0.99, 0.99),
    borderColor: rgb(0.85, 0.88, 0.92),
    borderWidth: 1,
  });

  const remarksText = data.teacherRemarks || "Satisfactory academic performance. Regular revision is encouraged.";
  page.drawText(remarksText, {
    x: margin + 12,
    y: y - 18,
    size: 9,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });

  if (data.correctionLog) {
    page.drawText(`* Revision note: ${data.correctionLog}`, {
      x: margin + 12,
      y: y - 34,
      size: 7.5,
      font,
      color: rgb(0.5, 0.3, 0.1),
    });
  }

  y -= 75;

  // 6. Grading Scale Legend Box
  page.drawRectangle({
    x: margin,
    y: y - 35,
    width: width - margin * 2,
    height: 40,
    color: rgb(0.96, 0.97, 0.99),
    borderColor: rgb(0.9, 0.92, 0.95),
    borderWidth: 0.5,
  });

  page.drawText("GRADING SCALE LEGEND:", {
    x: margin + 10,
    y: y - 12,
    size: 7,
    font: boldFont,
    color: rgb(0.3, 0.35, 0.45),
  });

  page.drawText("A+ (90-100%): Outstanding  |  A (80-89%): Excellent  |  B (70-79%): Very Good  |  C (60-69%): Good  |  D (50-59%): Satisfactory  |  F (<50%): Needs Improvement", {
    x: margin + 10,
    y: y - 25,
    size: 7,
    font,
    color: rgb(0.4, 0.45, 0.5),
  });

  y -= 95;

  // 7. Signature Sign-offs
  const sigY = margin + 40;
  const sigColWidth = 180;

  // Teacher signature line
  page.drawLine({
    start: { x: margin + 20, y: sigY },
    end: { x: margin + 20 + sigColWidth, y: sigY },
    thickness: 0.8,
    color: rgb(0.5, 0.5, 0.5),
  });
  page.drawText("Subject Teacher Signature", {
    x: margin + 45,
    y: sigY - 14,
    size: 8,
    font: boldFont,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Principal signature line
  page.drawLine({
    start: { x: width - margin - 20 - sigColWidth, y: sigY },
    end: { x: width - margin - 20, y: sigY },
    thickness: 0.8,
    color: rgb(0.5, 0.5, 0.5),
  });
  page.drawText("Principal / Academic Director & Stamp", {
    x: width - margin - sigColWidth,
    y: sigY - 14,
    size: 8,
    font: boldFont,
    color: rgb(0.3, 0.3, 0.3),
  });

  drawPoweredBy(page, font, boldFont, width / 2, margin - 3);

  return await pdfDoc.save();
}

