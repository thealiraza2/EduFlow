import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import { db } from "../src/lib/db";

// 1. Zod schemas for strict validation
export const boardEntrySchema = z.object({
  name: z.string().min(1, "Board name is required"),
  province: z.string().min(1, "Province is required"),
  website: z.string().url().optional(),
});

export const schemeStructureSchema = z.object({
  mcq: z
    .object({
      count: z.number().int().nonnegative("MCQ count cannot be negative"),
      marksEach: z.number().positive("MCQ marksEach must be positive"),
    })
    .optional(),
  short: z
    .object({
      count: z.number().int().nonnegative("Short questions count cannot be negative"),
      marksEach: z.number().positive("Short questions marksEach must be positive"),
      attempt: z.number().int().nonnegative().optional(),
    })
    .optional(),
  long: z
    .object({
      count: z.number().int().nonnegative("Long questions count cannot be negative"),
      marksEach: z.number().positive("Long questions marksEach must be positive"),
      attempt: z.number().int().nonnegative().optional(),
    })
    .optional(),
});

export const schemeEntrySchema = z
  .object({
    board: z.string().min(1, "Board is required"),
    className: z.enum(["9th", "10th", "11th", "12th"], {
      errorMap: () => ({ message: "className must be one of: 9th, 10th, 11th, 12th" }),
    }),
    subject: z.string().min(1, "Subject is required"),
    totalMarks: z.number().int().positive("Total marks must be positive"),
    timeMinutes: z.number().int().positive("Time must be positive").nullable().optional(),
    structure: schemeStructureSchema,
    sourceUrl: z.string().url("sourceUrl must be a valid URL"),
    verified: z.boolean(),
    notes: z.string().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    // Invariant: REFUSE to import any entry with verified: true
    if (data.verified !== false) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "REFUSED: Seeded scheme cannot be imported with verified: true. Must be verified: false.",
        path: ["verified"],
      });
    }
  });

export const punjabPairingDataSchema = z.object({
  province: z.string(),
  unified: z.boolean(),
  boards: z.array(boardEntrySchema).min(1, "At least one board is required"),
  schemes: z.array(schemeEntrySchema).min(1, "At least one scheme is required"),
});

export type SchemeEntry = z.infer<typeof schemeEntrySchema>;
export type BoardEntry = z.infer<typeof boardEntrySchema>;

/**
 * Validates a single scheme entry. Throws descriptive error if invalid or if verified: true.
 */
export function validateSchemeEntry(entry: unknown): SchemeEntry {
  const result = schemeEntrySchema.safeParse(entry);
  if (!result.success) {
    const errorDetails = result.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join("; ");
    throw new Error(`Invalid scheme entry: ${errorDetails}`);
  }
  return result.data;
}

/**
 * Main seeding function
 */
export async function seedSchemes(filePath?: string) {
  const targetPath =
    filePath || path.resolve(process.cwd(), "punjab-pairing-schemes.json");

  if (!fs.existsSync(targetPath)) {
    throw new Error(
      `File not found: ${targetPath}. Please ensure punjab-pairing-schemes.json is in the project root.`
    );
  }

  console.log(`\n[SEED SCHEMES] Reading data from ${targetPath}...`);
  const rawData = fs.readFileSync(targetPath, "utf-8");
  const jsonData = JSON.parse(rawData);

  // Validate entire dataset before touching the database
  const validatedData = punjabPairingDataSchema.parse(jsonData);

  // Validate each scheme entry with specific verified: false check
  for (let i = 0; i < validatedData.schemes.length; i++) {
    validateSchemeEntry(validatedData.schemes[i]);
  }

  console.log(
    `[SEED SCHEMES] Validation passed: ${validatedData.boards.length} boards, ${validatedData.schemes.length} unique unified schemes.`
  );

  // 1. Create or update Board records from the JSON boards array (upsert by name)
  const boardMap = new Map<string, string>(); // boardName -> boardId
  for (const b of validatedData.boards) {
    const board = await db.board.upsert({
      where: { name: b.name },
      create: {
        name: b.name,
        province: b.province,
      },
      update: {
        province: b.province,
      },
    });
    boardMap.set(b.name, board.id);
  }
  console.log(`[SEED SCHEMES] Processed ${boardMap.size} boards in DB.`);

  let createdOrUpdatedSchemesCount = 0;
  let partialCount = 0;

  // 2. Unified handling: create ONE PaperScheme row PER BOARD (32 x 9 = 288 rows)
  for (const scheme of validatedData.schemes) {
    // Check if partial: lacks short or long
    const lacksShort = !scheme.structure.short || !scheme.structure.short.count;
    const lacksLong = !scheme.structure.long || !scheme.structure.long.count;
    const isPartial = lacksShort || lacksLong;

    let schemeNotes = scheme.notes?.trim() || "";
    if (isPartial) {
      partialCount++;
      if (!schemeNotes) {
        schemeNotes = "PARTIAL: short/long breakdown unconfirmed — see SOURCES.md";
      } else if (!schemeNotes.startsWith("PARTIAL:")) {
        schemeNotes = `PARTIAL: ${schemeNotes}`;
      }
    }

    for (const board of validatedData.boards) {
      const boardId = boardMap.get(board.name)!;

      // Upsert Subject by unique constraint (boardId, className, name)
      // Note: Chapters are NOT created here; teachers manage chapters via /admin/boards
      const subject = await db.subject.upsert({
        where: {
          boardId_className_name: {
            boardId,
            className: scheme.className,
            name: scheme.subject,
          },
        },
        create: {
          boardId,
          className: scheme.className,
          name: scheme.subject,
        },
        update: {},
      });

      // Upsert PaperScheme by unique constraint (boardId, className, subjectId)
      await db.paperScheme.upsert({
        where: {
          boardId_className_subjectId: {
            boardId,
            className: scheme.className,
            subjectId: subject.id,
          },
        },
        create: {
          boardId,
          className: scheme.className,
          subjectId: subject.id,
          structure: scheme.structure,
          totalMarks: scheme.totalMarks,
          timeMinutes: scheme.timeMinutes ?? null,
          sourceUrl: scheme.sourceUrl,
          verified: false,
          notes: schemeNotes || null,
        },
        update: {
          structure: scheme.structure,
          totalMarks: scheme.totalMarks,
          timeMinutes: scheme.timeMinutes ?? null,
          sourceUrl: scheme.sourceUrl,
          notes: schemeNotes || null,
        },
      });

      createdOrUpdatedSchemesCount++;
    }
  }

  // Count PaperScheme rows associated with these 9 boards
  const punjabBoardIds = Array.from(boardMap.values());
  const punjabSchemeCount = await db.paperScheme.count({
    where: {
      boardId: { in: punjabBoardIds },
    },
  });

  const totalBoardsInDb = await db.board.count();
  const totalSchemesInDb = await db.paperScheme.count();

  console.log("\n=======================================================");
  console.log("   PUNJAB PAIRING SCHEMES IMPORT REPORT               ");
  console.log("=======================================================");
  console.log(`Boards Processed: ${validatedData.boards.length}`);
  console.log(`Total PaperScheme Rows for Punjab: ${punjabSchemeCount} (${validatedData.schemes.length} × ${validatedData.boards.length})`);
  console.log(`Unique Unified Schemes: ${validatedData.schemes.length} (${partialCount} partial schemes)`);
  console.log(`Total Boards in Database: ${totalBoardsInDb}`);
  console.log(`Total PaperSchemes in Database: ${totalSchemesInDb}`);
  console.log("=======================================================\n");

  return {
    boardsCount: validatedData.boards.length,
    punjabSchemeCount,
    uniqueSchemesCount: validatedData.schemes.length,
    partialCount,
    totalBoardsInDb,
    totalSchemesInDb,
  };
}

// Direct execution
if (require.main === module || process.argv[1]?.endsWith("seed-schemes.ts")) {
  seedSchemes()
    .then(() => {
      console.log("Pairing schemes seeding completed successfully.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Pairing schemes seeding failed:", err);
      process.exit(1);
    });
}
