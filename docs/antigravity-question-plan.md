# Question bank batch 2: phase-by-phase plan

This is the full work order for adding questions to the EduFlow question bank for the
PECTAA Class 9 and 10 books. Read the whole file before starting. Work through the
phases in order. Do not start a phase until the previous phase has passed its
verification gate. If any rule cannot be followed, stop and report instead of
working around it.

## The goal

Every chapter (unit) of every book must end with at least:

| MCQ | Short | Long |
|---|---|---|
| 20 | 15 | 4 |

The count includes all questions in the folder: existing ones, book exercise ones and
extra ones. Old questions that repeat a book question do not count.

The target is filled in two parts that must never be mixed:

- **Part A, book exercise questions:**
  - File: `content/<book>/zzz-exercise.cjs`.
  - Source: `EXERCISE`.
  - Exact copies from the book only.
- **Part B, extra questions to reach the target:**
  - File: `content/<book>/zzzzz-extra.cjs` (five z's).
  - Source: `ADDITIONAL`.
  - Original questions that repeat nothing already in the chapter.

## Hard rules (apply in every phase)

### 1. Book exercise questions (Part A) are exact copies, never invented

- **Where they come from:** only the end-of-chapter "Exercise" section of the book PDF or photos the owner gives you.
- **Exact wording:** copy the question and the options exactly as printed.
- **Page comment:** every row must end with a page comment on the same line, e.g. `// p.34 Q2(iii)`. The checker fails rows without it.
- **Do not:**
  - write, rephrase or "improve" a question;
  - take questions from memory, the internet, guidebooks, keybooks or past papers.
- **When to skip:** if a chapter's exercise pages are missing or unreadable, or no book file was given, skip Part A for that chapter and record it in the progress log. Never fill the gap with EXERCISE rows.
- **Leave out**, and record in the log:
  - fill-in-the-blanks, true/false, matching and diagram labelling;
  - questions that need a picture to be understood.
- **MCQ answers:**
  - take them from the book's answer key;
  - if the book has no key, answer only when certain, and otherwise leave the MCQ out and record it.
- **Urdu text** for a bilingual book:
  - copy it from the Urdu-medium edition of the same book if it was given;
  - otherwise set the Urdu text to `null`; do not translate it yourself.

### 2. Extra questions (Part B) are original and never repeat anything

- **Quantity:** add only as many as each chapter needs to reach 20 / 15 / 4.
- **Originality:**
  - questions must be correct, clear and based on that chapter's syllabus;
  - do not copy from guidebooks, keybooks, websites or past papers.
- **No repeats:** an extra question must not ask the same thing as any other question in the chapter, even in different words. That includes the old ones and the Part A ones. The checker fails exact or near-exact repeats and lists possible repeats as WARN. Read every WARN, and change your question if it is a real repeat.
- **Mix of types:**
  - concepts, definitions, reasons, differences and applications;
  - numericals and derivations for science and maths;
  - grammar, vocabulary and writing tasks for English and Urdu.
- **MCQs:**
  - exactly one correct answer;
  - three plausible but clearly wrong options;
  - correct answers spread over A–D.
- **Bilingual books** (physics, chemistry, biology, maths, computer): give both English and Urdu text, and options as `["en", "ur"]` pairs.

### 3. Never touch existing files

- **Files you may create:**
  - In a book folder: `zzz-exercise.cjs`, `zzzzz-extra.cjs` and `exercise-overlaps.md`.
  - Outside the book folders: only `docs/question-batch-progress.md` (the progress log).
- **Files you must never change**, rename or reorder:
  - any other file in `content/`, including `units.cjs`, `ch*.cjs`, `zz-more.cjs`, `zzzz-more.cjs`, `book.json`;
  - `content/load.cjs`, `content/build-sql.cjs`, `content/build-batch.cjs`, `content/urdu-extra.cjs`, `content/check-book.cjs`;
  - anything in `src/` or `prisma/`.
  
  Question ids depend on file order, so a change to an existing file breaks questions that are already live.
- `content/pecta-10-english/zzz-exercise.cjs` already exists. **Do not change it.** For that book, do Part B only.
- Use only unit numbers and topic codes that already exist in that book's files. Never create a new unit or topic.

### 4. Row format

Same as `content/pecta-10-english/zzz-exercise.cjs`:

```js
module.exports = [
  { unit: 1, q: [
    ["M", "1.2", "English question", "Urdu question or null", OPTIONS, "B", { source: "EXERCISE" }], // p.12 Q1(i)
    ["S", "1.1", "English question", "Urdu question or null", { source: "EXERCISE" }],              // p.13 Q2(iv)
    ["L", "1.3", "English question", "Urdu question or null", 5, { source: "EXERCISE" }],           // p.13 Q3
  ] },
];
```

- **OPTIONS:**
  - bilingual or English books: `[["en","ur"], ["en","ur"], ["en","ur"], ["en","ur"]]`;
  - Urdu, Islamiat and Pak Studies (Urdu-only books): 4 plain strings, with the English text `null`.
- **Answer letter:** A–D, matching the order of the options as you wrote them.
- **Long questions:** the 5th item is the marks. Use the same marks as the existing long questions of that book.
- **Source:** in `zzzzz-extra.cjs`, every row uses `{ source: "ADDITIONAL" }` instead of EXERCISE.

### 5. Git and database

- **Branch:** work only on `content/exercise-batch-2`, created from the latest `origin/main`. Never commit to main, never merge, never force-push.
- **Commits:** one commit per book, e.g. `Class 9 Physics: exercise + extra questions`. Push after every phase.
- **Database:**
  - never connect to Supabase or any database;
  - never run SQL;
  - never run `prisma migrate` or `prisma db push`;
  - never mark anything REVIEWED.
  
  The owner loads and reviews the questions after checking them.

## The checker

`content/check-book.cjs` verifies one book against `origin/main`:

```powershell
node content/check-book.cjs content/<book> --target 20,15,4 --write-overlaps
```

**It fails (exit code 1) when:**
- a file it protects changed;
- any existing question changed or moved;
- a row has the wrong source or no page comment;
- a row is malformed (unknown topic, bad MCQ, missing marks);
- an extra question repeats another one;
- a chapter is below the target.

**It also:**
- prints each chapter's totals;
- prints WARN pairs that need a human look;
- with `--write-overlaps`, writes `exercise-overlaps.md` (old questions that repeat a book question; the owner will hide them).

**A book is done only when the checker prints `PASS`.** Never edit the checker to make it pass.

## Per-book procedure (used in every phase)

For each book, in this order:

1. **Read.** Open the book's existing files and list its units and topic codes. Run the checker once to see the current totals.
2. **Part A.**
   - Go through the book's exercise pages chapter by chapter and write `zzz-exercise.cjs`.
   - Run the checker. Fix every FAIL except "below the target".
3. **Part B.**
   - From the checker's chapter totals, work out what each chapter still needs.
   - Write `zzzzz-extra.cjs`.
   - Run the checker with `--write-overlaps` until it prints `PASS`.
   - Read every WARN and fix real repeats.
4. **Self-review.** Before committing:
   - pick 10 random EXERCISE rows and compare them word for word with the book pages;
   - pick 10 random MCQs and solve them yourself to confirm the answer letter;
   - pick 5 random extra questions and confirm they are correct and not repeats.
   
   Fix anything wrong, run the checker again, and record the review in the progress log.
5. **Commit** that book alone.
6. **Log** the book in `docs/question-batch-progress.md`:
   - per-chapter totals: exercise / extra / final;
   - skipped chapters and left-out items, with the reason;
   - checker result;
   - number of overlaps;
   - the self-review result.

## Phases

| Phase | Books | Notes |
|---|---|---|
| 0 | none | Setup and baseline |
| 1 | `pecta-9-physics` | Pilot. **Stop after this phase and wait for the owner's OK.** |
| 2 | `pecta-9-chemistry`, `pecta-9-biology` | |
| 3 | `pecta-9-math`, `pecta-9-computer` | |
| 4 | `pecta-9-english`, `pecta-9-urdu` | |
| 5 | `pecta-9-islamiat`, `pecta-9-pakstudy` | |
| 6 | `pecta-10-physics`, `pecta-10-chemistry`, `pecta-10-biology` | |
| 7 | `pecta-10-math`, `pecta-10-computer` | |
| 8 | `pecta-10-english` (Part B only), `pecta-10-urdu` | |
| 9 | `pecta-10-islamiat`, `pecta-10-pakstudy` | |
| 10 | none | Final check and report |

### Phase 0: setup and baseline

1. `git fetch origin`, then create branch `content/exercise-batch-2` from `origin/main`.
2. Read these files:
   - `content/README.md`
   - `docs/question-bank.md`
   - `content/pecta-10-english/zzz-exercise.cjs`
   - this plan
3. Run the checker with `--target 20,15,4` on all 18 book folders, without `--write-overlaps`. Every book will be below the target; that is expected. Confirm that no other FAIL appears.
4. Create `docs/question-batch-progress.md` with:
   - a table of every book and chapter, its current totals, and how many MCQ / short / long it needs;
   - which books the owner has given PDFs or photos for.
5. Commit, then push.

**Gate:**
- the branch exists;
- the baseline table is complete;
- the checker shows no FAIL other than "below the target" for any book.

### Phases 1 to 9: books

Follow the per-book procedure for each book in the phase.

**Gate before moving to the next phase:**
- every book in the phase prints `PASS`;
- `git diff --name-only origin/main` lists only the allowed files;
- each book has its own commit;
- the self-reviews are logged;
- the branch is pushed.

**After Phase 1:**
- stop completely;
- write a short summary in the progress log;
- tell the owner the branch is ready for review.

Continue to Phase 2 only after the owner says so. Later phases may run one after another without stopping, as long as every gate passes. If a gate fails and you cannot fix it within the rules, stop and report.

### Phase 10: final check

1. Run the checker on all 18 books. All must print `PASS`.
2. Run `git diff --name-only origin/main` and confirm that only allowed files changed.
3. Finish the progress log with:
   - totals per book: EXERCISE added, ADDITIONAL added;
   - total overlaps;
   - every skipped chapter or left-out item;
   - anything the owner should look at.
4. Push and stop. Do not merge and do not touch the database.
