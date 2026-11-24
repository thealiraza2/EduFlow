# Question bank content

Source files for the textbook question bank (`/superadmin/bank`). Each folder is one
book: `book.json` holds the `Book` row, and the `*.cjs` files export its units.

- Units and topics follow the textbook's own chapter and section headings.
- Every question is original EduFlow content written to those topics (source
  `ADDITIONAL` or `CONCEPTUAL`); book exercise text is not reproduced here.
- Questions load as `DRAFT`; a super admin marks them reviewed before teachers'
  papers can use them.

## Row format

```js
["M", topic, en, ur, options, answerLetter] // MCQ; options are [en, ur] pairs, or plain strings for single-language books
["S", topic, en, ur]                        // short question (2 marks)
["L", topic, en, ur, marks]                 // long question
```

Topics are `[code, title]` or `[code, title, titleUr]`. Books with `"lang": "en"` or
`"lang": "ur"` in `book.json` leave the other language empty.

## Building SQL

```powershell
node content/build-batch.cjs out.sql content/pecta-9-physics content/pecta-9-chemistry
```

The SQL is idempotent: rows are keyed by stable ids, re-running updates question
text, options and answers but never changes review status. MCQ options are shuffled
deterministically per question so correct answers spread across A-D.
