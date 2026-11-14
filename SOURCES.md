# Punjab Pairing Schemes — Sources & Gaps

File: `punjab-pairing-schemes.json` · Version: `2026-2027 (PECTAA ALP)` · Collected: 14 Nov 2026

## Key finding: schemes are UNIFIED across Punjab

Pairing schemes are the **same for all 9 Punjab BISE boards**. Evidence:

- PECTAA Notification No. **PECTAA/C&C Unit/2026/1238** (Grade 9) and No. **PECTAA/C&C Unit/2026/1239** (Grade 11), both dated **06.11.2026**, apply to all nine boards (Lahore, Gujranwala, Rawalpindi, Sargodha, Faisalabad, Sahiwal, Multan, Dera Ghazi Khan, Bahawalpur) for the 2026-27 session and BISE Annual Examination 2027.
- Pre-2027 schemes were likewise uniform across Punjab boards (PBCC-coordinated; confirmed by multiple sources below).

Each scheme is therefore recorded **once per class/subject** (32 entries) and applies to all 9 boards. The JSON has `"unified": true`.

## Sources used

### 1. PECTAA — Grade 9 notification (OFFICIAL)
- **URL:** https://pectaa.edu.pk/wp-content/uploads/2026/11/ALP-9-Notification-06.11.2026-F.pdf
- **What:** Notification No. PECTAA/C&C Unit/2026/1238, dated 06.11.2026 — Smart Syllabus (ALP), Pairing Schemes and Model Papers, Grade 9, session 2026-27, BISE Annual Exam 2027. Copy list names all 9 boards.
- **Schemes from it:** 9th Physics, Chemistry, Biology, Mathematics, English, Urdu, Islamiat (structure totals + MCQ counts; the annex tables themselves are scanned images, so short/long detail came via source 2).
- **Note:** pectaa.edu.pk itself is behind a bot-verification wall and could not be browsed directly; the PDF was opened via its direct link.

### 2. Pakera — summary of PECTAA notifications 1238 & 1239
- **URL:** https://pakera.pk/punjab-smart-syllabus-2027-class-9-11-deleted-topics-pairing-scheme/
- **What:** Detailed read-out of both official PECTAA PDFs (marks tables, short/long attempt rules, timing, deleted topics). Checked 7 Nov 2026.
- **Schemes from it:** 9th Physics/Chemistry/Biology/Mathematics/English/Urdu/Islamiat; 11th Physics/Chemistry/Biology/Mathematics/English/Urdu/Computer Science & Entrepreneurship.
- **Note:** Secondary source (news explainer), but it quotes the official notification numbers, dates and tables, and its numbers were cross-checked against the official PDF (source 1) and the taleem360 copies (source 3).

### 3. Taleem360 — copy of official PECTAA 9th Computer Science pairing scheme (2026)
- **URL:** https://cdn1.taleem360.com/books/files/2818-9th-class-computer-pairing-scheme-2026-pdf-(taleem360.com)-Q1R8s.pdf
- **What:** 9th Class Computer pairing scheme 2026 per ALP/PECTAA Smart Syllabus (updated 9 Apr 2026), for all Punjab boards + AJK.
- **Schemes from it:** 9th Computer Science (MCQ 10; short 4-of-6 × 3 blocks = 24; long 2-of-3 × 8 = 16; total 50).
- **Note:** Hosted copy of the official PECTAA document, not the board site itself.

### 4. 786Times — 1200-marks scheme of study table (Matric)
- **URL:** https://786times.com/2023/04/1200-marks-new-scheme-of-study-matric-in-punjab-boards/
- **What:** Marks table for 9th/10th: Math 15/36/24=75; Physics/Chemistry/Biology 12/30/18=60; Computer 10/24/16=50.
- **Schemes from it:** 10th Physics, Chemistry, Biology, Mathematics, Computer Science (marks splits; attempt rules follow the 9th pattern, cross-checked with source 5).
- **Note:** Secondary source; numbers agree with sources 5 and 6.

### 5. HSA Notes — 10th class pairing scheme 2026 (circulating scheme)
- **URL:** https://hsanotes.com/pairing-scheme-2026-class-10-all-punjab-boards-matric-annual-exams-updated-for-bise-lahore-faisalabad-multan-rawalpindi-gujranwala-sargodha-bahawalpur-dg-khan-sahiwal-last-updated/
- **What:** Chapter-wise 10th scheme for 2026 annual exams (Maths, CS, Biology, Physics, Pak Studies, Chemistry).
- **Schemes from it:** 10th Mathematics (block data: 27 short questions, 5 long questions), 10th Computer Science (structure noted as inconsistent — NOT used), 10th Physics/Chemistry/Biology (block data: 3 blocks of 8 short questions).
- **Note:** The author openly states "Some of it doesn't add up" — its Pak Studies MCQ counts sum to 20 while claiming 15, and its 10th-science short/long totals (36/24) sum to 72 with MCQs against a 60-mark paper. Those figures were REJECTED; only the per-block question counts (which are consistent with the 9th structure and sources 4 and 6) were used.

### 6. SchoolSti — 10th class pairing scheme 2027 table
- **URL:** https://schoolsti.org.pk/10th-class-all-subjects-pairing-scheme-2027/
- **What:** Marks table: Physics/Chemistry/Biology 60 (12 MCQ / 30 short / 18 long); Mathematics 75 (15 / 36 / 24).
- **Schemes from it:** Corroboration for 10th Physics, Chemistry, Biology, Mathematics.
- **Note:** Secondary source; agrees with source 4.

### 7. Ilmroshan — 11th Islamiat paper scheme 2025
- **URL:** https://ilmroshan.com/1st-year-islamiat-paper-scheme-punjab-board/
- **What:** 11th Islamiat (Compulsory) 50 marks: MCQ 10; short 24 (Q2 6/9 + Q3 6/9); long 16 (2/3 × 8).
- **Schemes from it:** 11th Islamiat.
- **Note:** Secondary source, 2025 scheme. The PECTAA 2027 Grade-11 annex list omits Islamiat in one summary but shows a 50-mark Islamiat scheme in another — 2027 status is unclear (see GAPS).

### 8. TaleemSolution — 12th class total marks 2026
- **URL:** https://www.taleemsolution.com/punjab-boards-12th-class-total-marks-2026/index.html
- **What:** 12th totals: English 100, Urdu 100, Pakistan Studies 50, Physics/Chemistry/Biology 85 theory + 15 practical, Mathematics 100.
- **Schemes from it:** Totals for all 12th subjects. (12th science internal structure follows the standard 85-mark pattern identical to verified 11th science — flagged as unconfirmed in the JSON notes.)
- **Note:** Secondary source; totals agree with ilmkidunya's 12th marks distribution.

### 9. Ilmkidunya — 10th/12th marks distributions
- **URL:** https://www.ilmkidunya.com/10th-class/subjects.aspx and https://www.ilmkidunya.com/12th-class/books.aspx
- **What:** 10th: Maths 75; Physics/Chemistry/Biology 60 theory + 15 practical; Computer Science 50 + 15 practical. 12th: Biology/Physics/Chemistry 85 + 15 practical; Maths 100.
- **Schemes from it:** Totals + practical marks for 10th/12th science and computer science.
- **Note:** Secondary source; agrees with sources 4, 6, 8.

### 10. Freeilm.pk — scanned official 2026-27 pairing-scheme pages (Class 10)
- **URL:** https://www.facebook.com/freeilmpk/posts/pfbid02Kpf5gMDUYUVVjxziLevM3EquhmoKEoL3VQmf3n83EJY3EfWUJXrb4Pxwh5KY7RYdl
- **What:** Scanned pages of official pairing schemes for Class 10 (Biology/Chemistry/Physics 60, English 75, Computer Science & Entrepreneurship 50, Mathematics 75) for 2026-27.
- **Schemes from it:** Confirmation that 10th English and Urdu are 75-mark papers.
- **Note:** Facebook post of scanned official pages; used only for totals, not section counts.

### 11. BISE Lahore — official site (checked, no scheme published)
- **URL:** https://www.biselahore.com
- **What:** Board homepage; no pairing-scheme section exists. (BISE Lahore banned circulation of pairing schemes on social media in March 2025 — the boards do not publish schemes on their own sites; PECTAA is the issuing authority.)
- **Note:** This is WHY the official source for schemes is PECTAA, not the individual board sites.

## Scheme years in this file

| Classes | Scheme year | Basis |
|---|---|---|
| 9th (except Computer Science) | 2027 (Annual Exam 2027) | PECTAA Notification 1238, 06.11.2026 |
| 9th Computer Science | 2026 | Latest available; not in PECTAA 2027 annex |
| 10th (all subjects) | 2026 | Latest available; PECTAA 2027 notification for Class 10 NOT issued as of 7 Nov 2026 |
| 11th (except Islamiat) | 2027 (Annual Exam 2027) | PECTAA Notification 1239, 06.11.2026 |
| 11th Islamiat | 2025 | Latest with confirmed counts; 2027 status unclear |
| 12th (all subjects) | 2026 | Latest available; PECTAA 2027 notification for Class 12 NOT issued as of 7 Nov 2026 |

## GAPS — what could NOT be found (do not guess these)

### A. Section breakdowns not confirmed (entry exists with totals only)
1. **9th English** — short/long question counts unknown (only MCQ 19 + totals verified).
2. **9th Urdu** — short/long question counts unknown (only MCQ 15 + totals verified).
3. **9th Islamiat** — subjective split known in marks (40 short / 20 Hadith+personalities / 20 long) but question COUNTS per section unknown.
4. **10th English** — full section breakdown unknown (total 75 only).
5. **10th Urdu** — full section breakdown unknown (total 75 only).
6. **10th Pakistan Studies** — full section breakdown unknown AND sources conflict (see B below).
7. **11th English** — short/long counts unknown (only MCQ 20 + totals verified).
8. **11th Urdu** — short/long counts unknown (only MCQ 20 + totals verified).
9. **11th Mathematics** — short-question per-block counts unknown (only MCQ 20, long 3-of-5 × 10, and short total 50 verified).
10. **11th Computer Science & Entrepreneurship** — short/long counts unknown (only MCQ 15 + totals verified).
11. **12th English** — full section breakdown unknown (total 100 only).
12. **12th Urdu** — full section breakdown unknown (total 100 only).
13. **12th Pakistan Studies** — full section breakdown unknown (total 50 only).
14. **12th Mathematics** — MCQ count and short-question per-block counts unknown (only long 3-of-5 × 10 and total 100 verified).
15. **12th Computer Science** — theory/practical split and section breakdown unknown (total 100 only).

### B. Conflicting sources (recorded, not resolved)
- **10th Pakistan Studies:** one circulating scheme lists MCQ counts summing to 20 while claiming 15; another source lists MCQ 20 + short 50 + long 30 (= 100), which contradicts the 50-mark paper. No reliable breakdown — needs the official scheme.
- **10th Science short/long totals:** one circulating source lists short 36 + long 24 (= 72 with MCQs) against a 60-mark paper; two other sources list 30/18. The 30/18 figures were used; the 36/24 figures were rejected as internally inconsistent.
- **Computer Science practical marks:** ilmkidunya lists 15 practical marks; another table implies 25/year. Not resolved.

### C. Subjects not applicable (correctly absent — not gaps)
- **9th Pakistan Studies** — Pak Studies is examined in 10th class only in Punjab, not 9th.
- **10th Islamiat** — Islamiat is examined in 9th class only in Punjab, not 10th.
- **11th Pakistan Studies** — Pak Studies is examined in 12th class only in Punjab, not 11th.
- **12th Islamiat** — Islamiat is examined in 11th class only in Punjab, not 12th.
- **8th class** — out of scope by design: no BISE pairing scheme exists for 8th (PEC system; now school-based exams).

### D. Things tried that did not yield data
- **pectaa.edu.pk** (official site): bot-verification wall blocks browsing; only direct PDF links worked. The Grade-11 PDF link returned a bot-check page; its content was verified via the pakera read-out and two Facebook posts of the same PECTAA pages.
- **biselahore.com** and other board sites: no pairing-scheme section exists on the board websites themselves.
- **PECTAA Class 10 / Class 12 notifications (2027):** not published as of 7 Nov 2026 (confirmed by two independent sources). 10th/12th entries therefore use 2026 schemes.
- **9th Computer Science (2027):** not in the PECTAA 2027 Grade-9 annex (7 subjects only). Used the 2026 scheme instead.

## How to close the gaps
1. When PECTAA publishes the Class 10 and Class 12 smart-syllabus notifications (expected before the 2027 exams), download the PDFs from pectaa.edu.pk → Curriculum & Compliance → Smart Syllabus, and update the 10th/12th entries.
2. For English/Urdu/Islamiat/Pak Studies breakdowns, read the model papers inside the same PECTAA PDFs — the question counts are visible there even where summaries omit them.
3. A teacher must confirm every scheme (`verified: false` everywhere by design) before students rely on it.
