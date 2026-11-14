/**
 * AcademyHub - PDF Generation Module
 * Generates official 3-copy Fee Challans and Student Result Cards using pdf-lib.
 *
 * All amounts are formatted from integer minor units (paisa).
 */

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
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
  accountTitle: "AcademyHub Education Services",
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

  return await pdfDoc.save();
}
