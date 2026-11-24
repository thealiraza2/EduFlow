-- Class 10 English: these older bank questions ask the same thing as a question in the
-- EXERCISE set (zzz-exercise.cjs), so a paper could show both. Set them back to DRAFT
-- so the paper generator skips them. The rows stay in the content files, because
-- removing them would renumber the ids of later questions in the same topic.
-- build-sql never changes status, so re-running a build keeps them hidden.
UPDATE "BankQuestion"
SET status = 'DRAFT', "updatedAt" = now()
WHERE status = 'REVIEWED' AND id IN (
  'book_pecta_10_english_2026_u1_t1_1_s1',  -- improve the status of women
  'book_pecta_10_english_2026_u1_t1_1_s3',  -- improve the condition of slaves
  'book_pecta_10_english_2026_u4_t4_1_s1',  -- two major causes of climate change
  'book_pecta_10_english_2026_u5_t5_1_m3',  -- statue was covered with
  'book_pecta_10_english_2026_u5_t5_1_s3',  -- why the swallow stayed with the Prince
  'book_pecta_10_english_2026_u6_t6_1_s4',  -- role of schools against drug abuse
  'book_pecta_10_english_2026_u6_t6_3_l2',  -- essay: Drug Addiction
  'book_pecta_10_english_2026_u7_t7_1_s2',  -- lesson about time from the poem
  'book_pecta_10_english_2026_u8_t8_1_s3',  -- smog and health
  'book_pecta_10_english_2026_u8_t8_2_m7',  -- smog is a mixture of
  'book_pecta_10_english_2026_u9_t9_1_m2',  -- the two roads symbolise
  'book_pecta_10_english_2026_u9_t9_1_m3',  -- where the roads diverge
  'book_pecta_10_english_2026_u9_t9_1_s3',  -- "made all the difference"
  'book_pecta_10_english_2026_u10_t10_1_s1' -- answers to the king's three questions
);
