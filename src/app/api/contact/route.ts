import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { checkContactRateLimit } from "@/lib/rate-limit";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  contact: z.string().trim().min(5, "Please provide a valid phone number or email address"),
  message: z.string().trim().min(5, "Message must be at least 5 characters").max(2000, "Message cannot exceed 2000 characters"),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Resolve client IP for rate limiting
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const ip = forwardedFor?.split(",")[0]?.trim() || realIp || "127.0.0.1";

    // 2. Enforce 5 submissions/hour per IP rate limit
    const rateLimit = checkContactRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many submissions from this IP. Please wait before sending another message." },
        { status: 429 }
      );
    }

    // 3. Parse and validate body
    const body = await req.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid contact form input." },
        { status: 400 }
      );
    }

    const { name, contact, message } = parsed.data;

    // 4. Save to database
    const submission = await db.contactSubmission.create({
      data: {
        name,
        contact,
        message,
        ipAddress: ip,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Shukriya! Aapka message mil gaya hai. Hamari team jald rabta karegi.",
      id: submission.id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to submit message. Please try again." },
      { status: 500 }
    );
  }
}
