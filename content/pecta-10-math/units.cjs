// Class 10 Mathematics (PECTAA 2026, NCP 2023). Unit names from the textbook's
// table of contents; topics group each unit's main ideas. Questions are original
// EduFlow content.
module.exports = [
  {
    unit: 1, title: "Complex Numbers", titleUr: "مختلط اعداد",
    topics: [["1.1", "Complex Numbers and their Operations"], ["1.2", "Conjugate and Modulus"]],
    q: [
      ["M", "1.1", "i² equals:", "i² برابر ہے:", [["1", "1"], ["−1", "−1"], ["i", "i"], ["0", "0"]], "B"],
      ["M", "1.1", "(3 + 2i) + (1 − 5i) equals:", "(3 + 2i) + (1 − 5i) برابر ہے:", [["4 − 3i", "4 − 3i"], ["4 + 7i", "4 + 7i"], ["2 − 3i", "2 − 3i"], ["4 + 3i", "4 + 3i"]], "A"],
      ["M", "1.2", "The conjugate of 5 − 4i is:", "5 − 4i کا مزدوج ہے:", [["−5 + 4i", "−5 + 4i"], ["5 + 4i", "5 + 4i"], ["−5 − 4i", "−5 − 4i"], ["4 − 5i", "4 − 5i"]], "B"],
      ["M", "1.2", "The modulus of 3 + 4i is:", "3 + 4i کا مقیاس ہے:", [["7", "7"], ["5", "5"], ["25", "25"], ["1", "1"]], "B"],
      ["M", "1.1", "i⁴ equals:", "i⁴ برابر ہے:", [["1", "1"], ["−1", "−1"], ["i", "i"], ["−i", "−i"]], "A"],
      ["S", "1.1", "Simplify (2 + 3i)(1 − i).", "سادہ کریں: (2 + 3i)(1 − i)"],
      ["S", "1.2", "Divide (3 + i) by (1 + i) and write in the form a + bi.", "(3 + i) کو (1 + i) پر تقسیم کر کے a + bi کی شکل میں لکھیں۔"],
      ["L", "1.2", "If z₁ = 2 + 3i and z₂ = 1 − 2i, verify that |z₁z₂| = |z₁||z₂|.", "اگر z₁ = 2 + 3i اور z₂ = 1 − 2i ہوں تو ثابت کریں کہ |z₁z₂| = |z₁||z₂|۔", 5],
    ],
  },
  {
    unit: 2, title: "Quadratic Equations and Inequalities", titleUr: "دو درجی مساواتیں اور غیر مساواتیں",
    topics: [["2.1", "Solving Quadratic Equations"], ["2.2", "Nature of Roots"], ["2.3", "Quadratic Inequalities"]],
    q: [
      ["M", "2.1", "The roots of x² − 5x + 6 = 0 are:", "x² − 5x + 6 = 0 کے جذر ہیں:", [["2, 3", "2، 3"], ["−2, −3", "−2، −3"], ["1, 6", "1، 6"], ["−1, 6", "−1، 6"]], "A"],
      ["M", "2.2", "If the discriminant b² − 4ac < 0, the roots are:", "اگر ممیز b² − 4ac < 0 ہو تو جذر ہیں:", [["real and equal", "حقیقی اور برابر"], ["real and unequal", "حقیقی اور غیر برابر"], ["complex (imaginary)", "مختلط (خیالی)"], ["rational", "ناطق"]], "C"],
      ["M", "2.2", "For x² + 4x + 4 = 0 the roots are:", "x² + 4x + 4 = 0 کے جذر ہیں:", [["real and equal", "حقیقی اور برابر"], ["real and unequal", "حقیقی اور غیر برابر"], ["imaginary", "خیالی"], ["none", "کوئی نہیں"]], "A"],
      ["M", "2.1", "The sum of the roots of 2x² − 6x + 1 = 0 is:", "2x² − 6x + 1 = 0 کے جذروں کا مجموعہ ہے:", [["3", "3"], ["−3", "−3"], ["1/2", "1/2"], ["6", "6"]], "A"],
      ["S", "2.1", "Solve by the quadratic formula: x² + 2x − 4 = 0", "دو درجی فارمولے سے حل کریں: x² + 2x − 4 = 0"],
      ["S", "2.3", "Solve the inequality x² − 9 < 0.", "غیر مساوات x² − 9 < 0 کو حل کریں۔"],
      ["L", "2.1", "The length of a rectangle is 3 m more than its width and its area is 40 m². Form a quadratic equation and find its dimensions.", "ایک مستطیل کی لمبائی اس کی چوڑائی سے 3 میٹر زیادہ ہے اور رقبہ 40 مربع میٹر ہے۔ دو درجی مساوات بنا کر اس کی پیمائشیں معلوم کریں۔", 5],
    ],
  },
  {
    unit: 3, title: "Matrices and Determinants", titleUr: "میٹرکس اور مقطع",
    topics: [["3.1", "Types and Operations of Matrices"], ["3.2", "Determinant and Inverse of a Matrix"], ["3.3", "Solving Linear Equations by Matrices"]],
    q: [
      ["M", "3.1", "The order of a matrix with 2 rows and 3 columns is:", "2 قطاروں اور 3 کالموں والی میٹرکس کا درجہ ہے:", [["3 × 2", "3 × 2"], ["2 × 3", "2 × 3"], ["6", "6"], ["5", "5"]], "B"],
      ["M", "3.2", "The determinant of [[2, 3], [1, 4]] is:", "[[2, 3], [1, 4]] کا مقطع ہے:", [["5", "5"], ["11", "11"], ["8", "8"], ["−5", "−5"]], "A"],
      ["M", "3.2", "A matrix whose determinant is zero is called:", "وہ میٹرکس جس کا مقطع صفر ہو کہلاتی ہے:", [["non-singular", "غیر نادر"], ["singular", "نادر (سنگولر)"], ["identity", "اکائی"], ["diagonal", "وتری"]], "B"],
      ["M", "3.1", "A square matrix with 1s on the main diagonal and 0s elsewhere is the:", "مربع میٹرکس جس کے مرکزی وتر پر 1 اور باقی 0 ہوں:", [["zero matrix", "صفر میٹرکس"], ["identity matrix", "اکائی میٹرکس"], ["row matrix", "قطاری میٹرکس"], ["column matrix", "کالمی میٹرکس"]], "B"],
      ["S", "3.1", "If A = [[1, 2], [3, 4]] and B = [[2, 0], [1, 1]], find A + B and AB.", "اگر A = [[1, 2], [3, 4]] اور B = [[2, 0], [1, 1]] ہوں تو A + B اور AB معلوم کریں۔"],
      ["S", "3.2", "Find the inverse of [[3, 1], [5, 2]].", "[[3, 1], [5, 2]] کا معکوس معلوم کریں۔"],
      ["L", "3.3", "Solve by the matrix inversion method: 2x + y = 5, x − y = 1.", "میٹرکس معکوس کے طریقے سے حل کریں: 2x + y = 5، x − y = 1۔", 5],
    ],
  },
  {
    unit: 4, title: "Functions and Graphs", titleUr: "فنکشنز اور گراف",
    topics: [["4.1", "Absolute Value Functions"], ["4.2", "Graphs of Functions"]],
    q: [
      ["M", "4.1", "|−7| equals:", "|−7| برابر ہے:", [["−7", "−7"], ["7", "7"], ["0", "0"], ["1/7", "1/7"]], "B"],
      ["M", "4.1", "The solution of |x − 2| = 3 is:", "|x − 2| = 3 کا حل ہے:", [["x = 5 only", "صرف x = 5"], ["x = 5 or x = −1", "x = 5 یا x = −1"], ["x = −5", "x = −5"], ["x = 1", "x = 1"]], "B"],
      ["M", "4.2", "The graph of y = |x| has the shape of a:", "y = |x| کے گراف کی شکل ہوتی ہے:", [["straight line", "سیدھا خط"], ["V", "V"], ["circle", "دائرہ"], ["U", "U"]], "B"],
      ["S", "4.1", "Solve |2x + 1| ≤ 5.", "حل کریں: |2x + 1| ≤ 5"],
      ["S", "4.2", "Draw the graph of y = |x − 1| for −2 ≤ x ≤ 4.", "−2 ≤ x ≤ 4 کے لیے y = |x − 1| کا گراف بنائیں۔"],
      ["L", "4.2", "Draw the graphs of y = x² and y = x + 2 on the same axes and find their points of intersection.", "ایک ہی محوروں پر y = x² اور y = x + 2 کے گراف بنائیں اور ان کے نقاطِ تقاطع معلوم کریں۔", 5],
    ],
  },
  {
    unit: 5, title: "Algebraic Fractions", titleUr: "الجبری کسور",
    topics: [["5.1", "Simplifying Algebraic Fractions"], ["5.2", "Partial Fractions"]],
    q: [
      ["M", "5.1", "(x² − 1)/(x − 1) simplifies to:", "(x² − 1)/(x − 1) سادہ ہو کر بنتا ہے:", [["x − 1", "x − 1"], ["x + 1", "x + 1"], ["x²", "x²"], ["1", "1"]], "B"],
      ["M", "5.2", "A fraction is proper if the degree of the numerator is:", "کسر واجب ہوتی ہے اگر شمار کنندہ کا درجہ:", [["greater than the denominator's", "نسب نما سے زیادہ ہو"], ["less than the denominator's", "نسب نما سے کم ہو"], ["equal to the denominator's", "نسب نما کے برابر ہو"], ["zero only", "صرف صفر ہو"]], "B"],
      ["S", "5.1", "Simplify: 1/(x − 2) + 1/(x + 2)", "سادہ کریں: 1/(x − 2) + 1/(x + 2)"],
      ["S", "5.2", "Resolve into partial fractions: 1/((x − 1)(x + 1))", "جزوی کسور میں تحلیل کریں: 1/((x − 1)(x + 1))"],
      ["L", "5.2", "Resolve into partial fractions: (3x + 5)/((x + 1)(x + 2)).", "جزوی کسور میں تحلیل کریں: (3x + 5)/((x + 1)(x + 2))۔", 5],
    ],
  },
  {
    unit: 6, title: "Vectors in Plane", titleUr: "مستوی میں سمتیے",
    topics: [["6.1", "Vectors and their Representation"], ["6.2", "Operations on Vectors and Unit Vector"]],
    q: [
      ["M", "6.1", "The magnitude of the vector 3i + 4j is:", "سمتیہ 3i + 4j کی مقدار ہے:", [["7", "7"], ["5", "5"], ["12", "12"], ["1", "1"]], "B"],
      ["M", "6.2", "A vector of magnitude 1 is called a:", "مقدار 1 والا سمتیہ کہلاتا ہے:", [["null vector", "صفر سمتیہ"], ["unit vector", "اکائی سمتیہ"], ["position vector", "مقامی سمتیہ"], ["free vector", "آزاد سمتیہ"]], "B"],
      ["M", "6.2", "(2i + 3j) + (i − j) equals:", "(2i + 3j) + (i − j) برابر ہے:", [["3i + 2j", "3i + 2j"], ["3i + 4j", "3i + 4j"], ["i + 2j", "i + 2j"], ["2i + 2j", "2i + 2j"]], "A"],
      ["S", "6.2", "Find the unit vector in the direction of 6i − 8j.", "6i − 8j کی سمت میں اکائی سمتیہ معلوم کریں۔"],
      ["S", "6.1", "Find the position vector of the point (−2, 5).", "نقطہ (−2، 5) کا مقامی سمتیہ معلوم کریں۔"],
      ["L", "6.2", "If A(1, 2) and B(4, 6), find the vector AB, its magnitude and the unit vector along AB.", "اگر A(1، 2) اور B(4، 6) ہوں تو سمتیہ AB، اس کی مقدار اور AB کی سمت میں اکائی سمتیہ معلوم کریں۔", 5],
    ],
  },
  {
    unit: 7, title: "Trigonometry", titleUr: "مثلثیات",
    topics: [["7.1", "Trigonometric Identities and Ratios"], ["7.2", "Angles of Elevation and Depression"]],
    q: [
      ["M", "7.1", "cos 60° equals:", "cos 60° برابر ہے:", [["√3/2", "√3/2"], ["1/2", "1/2"], ["1", "1"], ["0", "0"]], "B"],
      ["M", "7.1", "1 + cot²θ equals:", "1 + cot²θ برابر ہے:", [["sec²θ", "sec²θ"], ["cosec²θ", "cosec²θ"], ["tan²θ", "tan²θ"], ["1", "1"]], "B"],
      ["M", "7.2", "The angle measured upward from the horizontal to an object is the angle of:", "افق سے اوپر کسی شے تک ناپا گیا زاویہ کہلاتا ہے:", [["depression", "زاویۂ نشیب"], ["elevation", "زاویۂ فراز"], ["incidence", "زاویۂ وقوع"], ["reflection", "زاویۂ انعکاس"]], "B"],
      ["S", "7.1", "Prove that (1 − cos²θ)(1 + cot²θ) = 1.", "ثابت کریں کہ (1 − cos²θ)(1 + cot²θ) = 1۔"],
      ["S", "7.2", "From a point 20 m from the foot of a tree, the angle of elevation of its top is 45°. Find the height of the tree.", "درخت کے پاؤں سے 20 میٹر دور ایک نقطے سے اس کی چوٹی کا زاویۂ فراز 45° ہے۔ درخت کی اونچائی معلوم کریں۔"],
      ["L", "7.2", "From the top of a 50 m high building, the angle of depression of a car on the road is 30°. Find the distance of the car from the building.", "50 میٹر اونچی عمارت کی چھت سے سڑک پر کھڑی کار کا زاویۂ نشیب 30° ہے۔ عمارت سے کار کا فاصلہ معلوم کریں۔", 5],
    ],
  },
  {
    unit: 8, title: "Chords and Arcs of a Circle", titleUr: "دائرے کے وتر اور قوسیں",
    topics: [["8.1", "Chords of a Circle"], ["8.2", "Arcs and Central Angles"]],
    q: [
      ["M", "8.1", "The perpendicular from the centre of a circle to a chord:", "دائرے کے مرکز سے وتر پر عمود:", [["bisects the chord", "وتر کی تنصیف کرتا ہے"], ["is equal to the chord", "وتر کے برابر ہوتا ہے"], ["is parallel to the chord", "وتر کے متوازی ہوتا ہے"], ["does not meet the chord", "وتر سے نہیں ملتا"]], "A"],
      ["M", "8.1", "Equal chords of a circle are:", "دائرے کے برابر وتر:", [["at different distances from the centre", "مرکز سے مختلف فاصلوں پر ہوتے ہیں"], ["equidistant from the centre", "مرکز سے مساوی فاصلے پر ہوتے ہیں"], ["always diameters", "ہمیشہ قطر ہوتے ہیں"], ["parallel", "متوازی ہوتے ہیں"]], "B"],
      ["M", "8.2", "The longest chord of a circle is the:", "دائرے کا سب سے لمبا وتر ہے:", [["radius", "رداس"], ["diameter", "قطر"], ["arc", "قوس"], ["tangent", "مماس"]], "B"],
      ["S", "8.1", "A chord of length 16 cm is 6 cm from the centre. Find the radius of the circle.", "16 سینٹی میٹر لمبا وتر مرکز سے 6 سینٹی میٹر پر ہے۔ دائرے کا رداس معلوم کریں۔"],
      ["L", "8.1", "Prove that the perpendicular from the centre of a circle to a chord bisects the chord.", "ثابت کریں کہ دائرے کے مرکز سے وتر پر گرایا گیا عمود وتر کی تنصیف کرتا ہے۔", 5],
    ],
  },
  {
    unit: 9, title: "Tangent and Angles of a Circle", titleUr: "دائرے کا مماس اور زاویے",
    topics: [["9.1", "Tangent to a Circle"], ["9.2", "Angles in a Circle"]],
    q: [
      ["M", "9.1", "A tangent to a circle is perpendicular to the:", "دائرے کا مماس عمود ہوتا ہے:", [["chord", "وتر پر"], ["radius at the point of contact", "نقطۂ تماس پر رداس پر"], ["diameter always", "ہمیشہ قطر پر"], ["arc", "قوس پر"]], "B"],
      ["M", "9.2", "The angle in a semicircle is:", "نصف دائرے میں زاویہ ہوتا ہے:", [["45°", "45°"], ["90°", "90°"], ["180°", "180°"], ["60°", "60°"]], "B"],
      ["M", "9.2", "The angle subtended by an arc at the centre is ___ the angle it subtends at the circumference.", "قوس کا مرکز پر بننے والا زاویہ محیط پر بننے والے زاویے کا ___ ہوتا ہے۔", [["half", "نصف"], ["double", "دگنا"], ["equal to", "برابر"], ["triple", "تین گنا"]], "B"],
      ["S", "9.1", "Two tangents are drawn to a circle from an external point. Prove that they are equal in length.", "بیرونی نقطے سے دائرے پر دو مماس کھینچے گئے ہیں۔ ثابت کریں کہ وہ لمبائی میں برابر ہیں۔"],
      ["L", "9.2", "Prove that the opposite angles of a cyclic quadrilateral are supplementary.", "ثابت کریں کہ دائری چوکور کے مخالف زاویے متمم ہوتے ہیں۔", 5],
    ],
  },
  {
    unit: 10, title: "Practical Geometry of Circles", titleUr: "دائروں کی عملی جیومیٹری",
    topics: [["10.1", "Constructing Circles and Tangents"]],
    q: [
      ["M", "10.1", "The circle passing through all three vertices of a triangle is the:", "مثلث کے تینوں راسوں سے گزرنے والا دائرہ ہے:", [["incircle", "محصور دائرہ"], ["circumcircle", "محاصرہ دائرہ"], ["escribed circle", "جانبی دائرہ"], ["unit circle", "اکائی دائرہ"]], "B"],
      ["M", "10.1", "The centre of the incircle of a triangle is found by drawing the:", "مثلث کے محصور دائرے کا مرکز معلوم کیا جاتا ہے کھینچ کر:", [["perpendicular bisectors of the sides", "اضلاع کے عمودی ناصف"], ["angle bisectors", "زاویوں کے ناصف"], ["medians", "وسطانیے"], ["altitudes", "ارتفاع"]], "B"],
      ["S", "10.1", "Draw a circle of radius 3 cm and draw a tangent to it from a point 5 cm from the centre.", "3 سینٹی میٹر رداس کا دائرہ بنائیں اور مرکز سے 5 سینٹی میٹر دور نقطے سے اس پر مماس کھینچیں۔"],
      ["L", "10.1", "Construct a triangle with sides 5 cm, 6 cm and 7 cm and draw its circumcircle.", "5 سینٹی میٹر، 6 سینٹی میٹر اور 7 سینٹی میٹر اضلاع والی مثلث بنائیں اور اس کا محاصرہ دائرہ کھینچیں۔", 5],
    ],
  },
  {
    unit: 11, title: "Information Handling", titleUr: "معلومات کا استعمال",
    topics: [["11.1", "Measures of Central Tendency"], ["11.2", "Measures of Dispersion"]],
    q: [
      ["M", "11.2", "The range of 4, 9, 2, 15, 7 is:", "4، 9، 2، 15، 7 کی سعت ہے:", [["13", "13"], ["11", "11"], ["15", "15"], ["7", "7"]], "A"],
      ["M", "11.2", "The square of the standard deviation is the:", "معیاری انحراف کا مربع کہلاتا ہے:", [["mean", "اوسط"], ["variance", "تغیر (ویری ئنس)"], ["range", "سعت"], ["mode", "موڈ"]], "B"],
      ["M", "11.1", "The middle value of arranged data is the:", "ترتیب دیے گئے ڈیٹا کی درمیانی قیمت ہے:", [["mean", "اوسط"], ["median", "وسطانیہ"], ["mode", "موڈ"], ["range", "سعت"]], "B"],
      ["S", "11.2", "Find the variance of 2, 4, 6, 8, 10.", "2، 4، 6، 8، 10 کا تغیر معلوم کریں۔"],
      ["L", "11.2", "Find the mean and standard deviation of the marks 10, 12, 14, 16, 18 and interpret the result.", "نمبروں 10، 12، 14، 16، 18 کا اوسط اور معیاری انحراف معلوم کریں اور نتیجے کی تشریح کریں۔", 5],
    ],
  },
  {
    unit: 12, title: "Probability", titleUr: "احتمال",
    topics: [["12.1", "Probability of Events"], ["12.2", "Combined Events"]],
    q: [
      ["M", "12.1", "Two coins are tossed. The probability of getting two heads is:", "دو سکے اچھالے جاتے ہیں۔ دونوں ہیڈ آنے کا احتمال ہے:", [["1/2", "1/2"], ["1/4", "1/4"], ["3/4", "3/4"], ["1", "1"]], "B"],
      ["M", "12.2", "Two events that cannot happen together are called:", "وہ دو واقعات جو ایک ساتھ نہ ہو سکیں کہلاتے ہیں:", [["independent", "آزاد"], ["mutually exclusive", "باہم خارج"], ["equally likely", "یکساں ممکن"], ["certain", "یقینی"]], "B"],
      ["M", "12.1", "A die is rolled. The probability of an even number is:", "ایک پانسا پھینکا جاتا ہے۔ جفت عدد آنے کا احتمال ہے:", [["1/6", "1/6"], ["1/2", "1/2"], ["1/3", "1/3"], ["2/3", "2/3"]], "B"],
      ["S", "12.2", "If P(A) = 0.4, P(B) = 0.3 and A, B are mutually exclusive, find P(A or B).", "اگر P(A) = 0.4، P(B) = 0.3 اور A، B باہم خارج ہوں تو P(A یا B) معلوم کریں۔"],
      ["L", "12.2", "Two dice are rolled together. Find the probability that the sum is (a) 7 (b) greater than 9 (c) a prime number.", "دو پانسے ایک ساتھ پھینکے جاتے ہیں۔ احتمال معلوم کریں کہ مجموعہ (الف) 7 ہو (ب) 9 سے زیادہ ہو (ج) مفرد عدد ہو۔", 5],
    ],
  },
];
