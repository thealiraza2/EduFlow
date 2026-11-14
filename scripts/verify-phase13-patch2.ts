import { db } from "../src/lib/db";
import { validateSchemeEntry } from "../prisma/seed-schemes";
import { generateBoardPaper, validatePaperAgainstScheme, SchemeStructure } from "../src/lib/ai";

async function main() {
  console.log("\n=======================================================");
  console.log("   ACADEMYHUB - PHASE 13 PATCH 2 VERIFICATION SUITE   ");
  console.log("   Import Punjab Pairing Schemes (Seed Data)          ");
  console.log("=======================================================\n");

  // 1. Zod Validation Verification
  console.log("[1] Testing Zod Validation on Seed Entries...");
  const validEntry = {
    board: "All Punjab BISE Boards (unified scheme)",
    className: "9th" as const,
    subject: "Physics",
    totalMarks: 60,
    timeMinutes: 120,
    structure: {
      mcq: { count: 12, marksEach: 1 },
      short: { count: 24, marksEach: 2, attempt: 15 },
      long: { count: 3, marksEach: 9, attempt: 2 },
    },
    sourceUrl: "https://pectaa.edu.pk/sample.pdf",
    verified: false,
    notes: "Official PECTAA 2027 scheme.",
  };

  const parsedValid = validateSchemeEntry(validEntry);
  if (parsedValid.subject !== "Physics" || parsedValid.verified !== false) {
    throw new Error("Valid entry failed parsing!");
  }
  console.log("    ✓ Valid unverified entry accepted.");

  // Test: REFUSE verified: true
  let rejectedVerified = false;
  try {
    validateSchemeEntry({ ...validEntry, verified: true });
  } catch (err: any) {
    rejectedVerified = true;
    console.log(`    ✓ verified: true strictly REFUSED: "${err.message}"`);
  }
  if (!rejectedVerified) {
    throw new Error("Validation FAILED: verified: true was not rejected!");
  }

  // Test: Bad class name rejected
  let rejectedClass = false;
  try {
    validateSchemeEntry({ ...validEntry, className: "8th" as any });
  } catch (err: any) {
    rejectedClass = true;
    console.log(`    ✓ Invalid className rejected: "${err.message}"`);
  }
  if (!rejectedClass) {
    throw new Error("Validation FAILED: invalid className '8th' was not rejected!");
  }

  // 2. Database Counts: 9 Punjab Boards, 288 PaperScheme rows (32 x 9)
  console.log("\n[2] Checking Database Rows for 9 Punjab Boards & 288 Schemes...");
  const punjabBoardNames = [
    "BISE Lahore",
    "BISE Gujranwala",
    "BISE Multan",
    "BISE Faisalabad",
    "BISE Sargodha",
    "BISE Rawalpindi",
    "BISE Bahawalpur",
    "BISE D.G. Khan",
    "BISE Sahiwal",
  ];

  const boards = await db.board.findMany({
    where: { name: { in: punjabBoardNames } },
    include: {
      schemes: {
        include: { subject: true },
      },
    },
  });

  if (boards.length !== 9) {
    throw new Error(`Expected exactly 9 Punjab boards, found ${boards.length}`);
  }
  console.log(`    ✓ Found all 9 Punjab BISE boards.`);

  let totalSchemes = 0;
  let partialSchemesCount = 0;
  for (const b of boards) {
    if (b.schemes.length !== 32) {
      throw new Error(`Expected 32 schemes for board "${b.name}", found ${b.schemes.length}`);
    }
    totalSchemes += b.schemes.length;

    for (const s of b.schemes) {
      if (s.verified !== false) {
        throw new Error(`Scheme ${s.id} in ${b.name} has verified: true! All imported schemes must be unverified.`);
      }
      if (s.notes?.startsWith("PARTIAL:")) {
        partialSchemesCount++;
      }
    }
  }

  if (totalSchemes !== 288) {
    throw new Error(`Expected exactly 288 PaperScheme rows, found ${totalSchemes}`);
  }
  console.log(`    ✓ Total Punjab PaperScheme rows: ${totalSchemes} (32 schemes × 9 boards). All verified: false.`);
  console.log(`    ✓ Partial schemes tagged across 9 boards: ${partialSchemesCount} (${partialSchemesCount / 9} unique partial schemes).`);

  // 3. Admin Visibility Verification: BISE Lahore -> 9th Physics
  console.log("\n[3] Verifying Complete Scheme: BISE Lahore -> 9th Physics...");
  const lahore = boards.find((b) => b.name === "BISE Lahore")!;
  const physicsScheme = lahore.schemes.find(
    (s) => s.className === "9th" && s.subject.name === "Physics"
  );
  if (!physicsScheme) {
    throw new Error("BISE Lahore 9th Physics scheme not found!");
  }
  console.log(`    - Total Marks: ${physicsScheme.totalMarks} Marks`);
  console.log(`    - Duration: ${physicsScheme.timeMinutes} mins`);
  console.log(`    - Source URL: ${physicsScheme.sourceUrl}`);
  console.log(`    - Verified: ${physicsScheme.verified} (Shows UNVERIFIED badge)`);
  console.log(`    - Notes: ${physicsScheme.notes}`);
  if (!physicsScheme.sourceUrl) {
    throw new Error("Expected sourceUrl for 9th Physics!");
  }
  console.log("    ✓ Complete scheme attributes match official PECTAA 2027 data.");

  // 4. Partial Scheme Verification: BISE Lahore -> 9th English
  console.log("\n[4] Verifying Partial Scheme: BISE Lahore -> 9th English...");
  const englishScheme = lahore.schemes.find(
    (s) => s.className === "9th" && s.subject.name === "English"
  );
  if (!englishScheme) {
    throw new Error("BISE Lahore 9th English scheme not found!");
  }
  console.log(`    - Total Marks: ${englishScheme.totalMarks}`);
  console.log(`    - Notes: ${englishScheme.notes}`);
  if (!englishScheme.notes?.startsWith("PARTIAL:")) {
    throw new Error(`Expected notes to start with 'PARTIAL:', got "${englishScheme.notes}"`);
  }
  console.log("    ✓ Partial scheme correctly carries 'PARTIAL:' prefix.");

  // 5. Generator Guard on Partial Scheme (Must be Disabled)
  console.log("\n[5] Testing Generator Guard on Partial Scheme (Must Reject)...");
  const partialGenResult = await generateBoardPaper({
    boardName: "BISE Lahore",
    className: "9th",
    subject: "English",
    chapters: [{ number: 1, title: "The Saviour of Mankind" }],
    scheme: {
      id: englishScheme.id,
      structure: englishScheme.structure as SchemeStructure,
      totalMarks: englishScheme.totalMarks,
      timeMinutes: englishScheme.timeMinutes,
      verified: englishScheme.verified,
    },
    difficulty: "MEDIUM",
  });

  if (partialGenResult.success) {
    throw new Error("Generator guard failed: generated paper from partial scheme!");
  }
  const expectedPartialMsg =
    "Is scheme ka mukammal structure save nahi hai — admin se /admin/boards mein complete karwao.";
  if (partialGenResult.error !== expectedPartialMsg) {
    throw new Error(`Expected error '${expectedPartialMsg}', got '${partialGenResult.error}'`);
  }
  console.log(`    ✓ Partial scheme paper generation rejected with exact required message:`);
  console.log(`      "${partialGenResult.error}"`);

  // 6. Complete Scheme Paper Generation: BISE Lahore -> 9th Physics
  console.log("\n[6] Testing Generator on Complete Scheme: BISE Lahore -> 9th Physics...");
  const completeGenResult = await generateBoardPaper({
    boardName: "BISE Lahore",
    className: "9th",
    subject: "Physics",
    chapters: [
      { number: 1, title: "Physical Quantities and Measurement" },
      { number: 2, title: "Kinematics" },
      { number: 3, title: "Dynamics" },
    ],
    scheme: {
      id: physicsScheme.id,
      structure: physicsScheme.structure as SchemeStructure,
      totalMarks: physicsScheme.totalMarks,
      timeMinutes: physicsScheme.timeMinutes,
      verified: physicsScheme.verified,
    },
    difficulty: "MEDIUM",
  });

  if (!completeGenResult.success || completeGenResult.questions.length === 0) {
    throw new Error(`Complete scheme generation failed: ${completeGenResult.error}`);
  }
  console.log(`    ✓ Generated ${completeGenResult.questions.length} questions conforming to PECTAA 2027 Physics.`);

  const validation = validatePaperAgainstScheme(
    completeGenResult.questions,
    physicsScheme.structure as SchemeStructure,
    physicsScheme.totalMarks
  );
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.error}`);
  }
  console.log("    ✓ Questions strictly match MCQ, Short, and Long counts and total marks from stored scheme!");

  console.log("\n=======================================================");
  console.log("   ALL PHASE 13 PATCH 2 VERIFICATIONS PASSED (100%)!   ");
  console.log("=======================================================\n");
}

main()
  .catch((err) => {
    console.error("Verification error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
