import { Noto_Nastaliq_Urdu } from "next/font/google";

/** Nastaliq for Urdu question text and printed papers. Apply `urdu.className` to Urdu blocks. */
export const urdu = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  weight: ["400", "700"],
  display: "swap",
});
