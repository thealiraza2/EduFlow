# Question bank and paper generator: technical summary

This describes how the code works today. Sources: `prisma/schema.prisma`,
`src/lib/bank/csv.ts`, `src/lib/actions/bank.ts` and `content/`.

## 1. Where questions are stored

The hierarchy is `TextbookAuthority → Book → BookUnit → BookTopic → BankQuestion`.

### `BankQuestion`

| Column | Type | Notes |
|---|---|---|
| `id` | `String` | primary key, `cuid()` by default |
| `bookId` | `String` | → `Book.id` (cascade delete) |
| `unitId` | `String` | → `BookUnit.id` (cascade delete) |
| `topicId` | `String?` | → `BookTopic.id` (set to null on delete) |
| `type` | `BankQuestionType` | `MCQ`, `SHORT`, `LONG` |
| `source` | `BankQuestionSource` | defaults to `EXERCISE` |
| `textEn` | `String?` | question in English |
| `textUr` | `String?` | question in Urdu |
| `options` | `Json?` | MCQ only: `[{ "en": "...", "ur": "..." }, ...]` (4 items) |
| `answer` | `String?` | MCQ: index of the correct option, `"0"`–`"3"`. Other types: model answer text |
| `marks` | `Float` | default `1` |
| `parts` | `Json?` | LONG parts: `[{ "label": "a", "en": "...", "ur": "...", "marks": 4 }]` |
| `imageUrl` | `String?` | |
| `pastPaperRef` | `String?` | e.g. `"BISE Lahore 2024, Group I"` |
| `status` | `ContentStatus` | `DRAFT` (default) or `REVIEWED` |
| `createdById` | `String?` | |
| `createdAt` | `DateTime` | default `now()` |
| `updatedAt` | `DateTime` | `@updatedAt` |

Indexes: `(bookId, type, status)`, `(unitId)`, `(topicId)`.

The paper generator only uses questions with `status = REVIEWED`.

### Parent tables

- **`Book`:**
  - Columns: `id`, `authorityId`, `className` (`"9"`, `"10"`, `"11"`, `"12"`), `subject`, `subjectUr?`, `edition`, `sessionFrom` (`Int`), `isCurrent` (`Boolean`, default `true`), `sourceUrl?`, `createdAt`, `updatedAt`.
  - Unique on `(authorityId, className, subject, edition)`.
- **`BookUnit`:** `id`, `bookId`, `number` (`Int`), `title`, `titleUr?`. Unique on `(bookId, number)`.
- **`BookTopic`:** `id`, `unitId`, `code` (e.g. `"1.2"`), `title`, `titleUr?`, `order` (`Int`). Unique on `(unitId, code)`.
- **`TextbookAuthority`:** `id`, `code` (unique, e.g. `"PECTA"`), `name`, `province`. The live database uses the id `auth_pecta`.

## 2. The "Book exercise" source value

The enum is `BankQuestionSource`, and its value is **`EXERCISE`**:

```prisma
enum BankQuestionSource {
  EXERCISE
  PAST_PAPER
  ADDITIONAL
  CONCEPTUAL
}
```

"Book exercise" is only the label the paper wizard shows. In the CSV `source` column these values are accepted (case-insensitive) and stored as `EXERCISE`:

- `exercise`
- `ex`
- `book`
- an empty cell

## 3. CSV upload at `/superadmin/bank/[bookId]`

The book is chosen by the page you upload on, not by the file.

**Header row** (any order, case-insensitive). Only `unit`, `type`, and one of `question_en`/`question_ur` are required:

```
unit,unit_title,topic,topic_title,type,source,question_en,question_ur,a_en,a_ur,b_en,b_ur,c_en,c_ur,d_en,d_ur,answer,marks,past_paper
```

**Two sample rows** (the same rows as the template at `/api/bank/template`):

```
1,Physical Quantities and Measurement,1.1,Physical quantities,MCQ,exercise,The SI unit of length is:,لمبائی کا ایس آئی یونٹ ہے:,metre,میٹر,foot,فٹ,inch,انچ,mile,میل,A,1,
1,,1.2,Measuring instruments,SHORT,past_paper,What is the least count of a vernier callipers?,ورنیئر کیلی پرز کا لیسٹ کاؤنٹ کیا ہے؟,,,,,,,,,,2,BISE Lahore 2024
```

**Column rules:**

- **`type`:**
  - `MCQ` (also accepts `MCQS`, `OBJECTIVE`, `M`)
  - `SHORT` (also `SQ`, `S`)
  - `LONG` (also `LQ`, `L`)
- **MCQ:**
  - All four options are needed: `a`–`d`, in English or Urdu.
  - `answer` must be `A`, `B`, `C` or `D`. It is stored as `"0"`–`"3"`.
- **`marks`:**
  - If left empty, the default is MCQ 1, SHORT 2, LONG 5.
  - Allowed range: more than 0 and at most 50.
- **File limits:**
  - At most 3,000 rows per file.
  - At most about 6 MB per file.
  - UTF-8; a BOM is fine.
- **Imported status:** every imported question starts as `DRAFT`. Mark it reviewed in the same page.
- **Errors:** if any row has an error, nothing from the file is imported. The page lists the failing lines.

## 4. Seeding and ID mapping

### a) CSV import (UI)

`importQuestionsAction(bookId, csvText)` in `src/lib/actions/bank.ts`:

- **Book:** the book whose page you are on.
- **Unit:** the `unit` number maps to `BookUnit.number` in that book. If the unit does not exist, it is created when the file gives a `unit_title`; otherwise the import stops.
- **Topic:** `topic` maps to `BookTopic.code` inside that unit. A missing topic is created, using `topic_title` as its title.
- **Ids:** new rows get `cuid()` ids.

### b) Content files (what loaded the current 3,052 questions)

| Path | What it does |
|---|---|
| `content/<book-folder>/book.json` | the `Book` row (id, authority, class, subject, edition, `lang`) |
| `content/<book-folder>/*.cjs` | units, topics and questions; a later file such as `zz-more.cjs` appends to existing units |
| `content/load.cjs` | loads a folder and merges units with the same number |
| `content/build-sql.cjs` | turns one folder into SQL |
| `content/build-batch.cjs` | turns several folders into one SQL file |
| `content/urdu-extra.cjs` | shared grammar/composition bank for the Urdu books |
| `content/gaps.cjs` | reports chapters below a target count |

The SQL is run in the Supabase SQL editor; this database has no Prisma migration history. The ids are deterministic, so re-running the build updates the same rows:

- **Book:** from `book.json`, e.g. `book_pecta_9_physics_ncp2023`.
- **Unit:** `<bookId>_u<unit>`, e.g. `book_pecta_9_physics_ncp2023_u2`.
- **Topic:** `<unitId>_t<code with . → _>`, e.g. `..._u2_t2_5`.
- **Question:** `<topicId>_<m|s|l><n>`, numbered per type within each topic in file order, e.g. `..._u2_t2_5_m1`.

Inserts use `ON CONFLICT (id) DO UPDATE`. Text, options, answer, marks and source are updated; review status is never changed. MCQ options are shuffled with a seed taken from the question id, so the correct answers spread evenly across A–D.

Row format in the `.cjs` files (see `content/README.md`):

```js
["M", topic, en, ur, options, answerLetter] // options: [en, ur] pairs or plain strings
["S", topic, en, ur]
["L", topic, en, ur, marks]
```

Build example:

```powershell
node content/build-batch.cjs out.sql content/pecta-9-physics content/pecta-9-chemistry
```
