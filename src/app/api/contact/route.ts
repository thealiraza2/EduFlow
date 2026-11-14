import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { checkContactRateLimit } from "@/lib/rate-limit";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  contact: z.string().trim().optional(),
  email: z.string().trim().email("Please provide a valid email address").optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  schoolName: z.string().trim().optional(),
  topic: z.string().trim().optional(),
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

    const { name, contact, email, phone, schoolName, topic, message } = parsed.data;

    // Build contact info string
    const contactInfo = contact || [email, phone].filter(Boolean).join(" • ") || "Not provided";
    
    // Build enriched message if metadata provided
    const messageParts: string[] = [];
    if (topic) messageParts.push(`[Topic: ${topic}]`);
    if (schoolName) messageParts.push(`[School: ${schoolName}]`);
    messageParts.push(message);
    const finalMessage = messageParts.join("\n\n");

    // 4. Save to database
    const submission = await db.contactSubmission.create({
      data: {
        name,
        contact: contactInfo,
        message: finalMessage,
        ipAddress: ip,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Thank you! Your message has been received. Our team will contact you shortly.",
      id: submission.id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to submit message. Please try again." },
      { status: 500 }
    );
  }
}
