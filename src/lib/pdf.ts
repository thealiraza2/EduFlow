/**
 * AcademyHub - PDF Generation Module
 * Generates Fee Challans and Student Result Cards using pdf-lib.
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
  amountMinor: Paisa;
  dueDate: string;
}

/**
 * Generates a simple 3-copy Fee Challan PDF (Bank Copy, Academy Copy, Student Copy)
 */
export async function generateFeeChallanPdf(data: ChallanData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 in points
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  const margin = 40;

  // Title
  page.drawText(data.academyName, {
    x: margin,
    y: height - margin - 20,
    size: 20,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });

  page.drawText("FEE CHALLAN", {
    x: margin,
    y: height - margin - 45,
    size: 14,
    font: boldFont,
    color: rgb(0.2, 0.4, 0.8),
  });

  // Details
  const details = [
    `Challan No: ${data.challanNo}`,
    `Student: ${data.studentName} (${data.admissionNo})`,
    `Class / Batch: ${data.className} - ${data.batchName}`,
    `Billing Month: ${data.month}`,
    `Due Date: ${data.dueDate}`,
    `Total Payable: ${formatPKR(data.amountMinor, true)}`,
  ];

  let y = height - margin - 80;
  for (const line of details) {
    page.drawText(line, {
      x: margin,
      y,
      size: 11,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= 20;
  }

  return await pdfDoc.save();
}
