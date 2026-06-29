import { NextResponse } from "next/server";

import { analyzeImage } from "@/lib/gemini";
import { normalizeImageInput } from "@/lib/image";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const imageUrl = formData.get("imageUrl");

    const { base64, mimeType } = await normalizeImageInput({
      file: file instanceof File && file.size > 0 ? file : null,
      imageUrl: typeof imageUrl === "string" ? imageUrl : null,
    });

    const result = await analyzeImage(base64, mimeType);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Analysis failed.";

    if (
      message.includes("Provide") ||
      message.includes("must be") ||
      message.includes("Unsupported") ||
      message.includes("Could not fetch") ||
      message.includes("Uploaded file")
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (message.includes("GEMINI_API_KEY")) {
      return NextResponse.json(
        { error: "Server is missing GEMINI_API_KEY. Add it to .env.local." },
        { status: 500 },
      );
    }

    if (
      message.includes("503") ||
      message.includes("high demand") ||
      message.includes("unavailable") ||
      message.includes("429") ||
      message.includes("resource exhausted")
    ) {
      return NextResponse.json(
        {
          error:
            "The AI service is temporarily busy. Please wait a few seconds and try again.",
        },
        { status: 503 },
      );
    }

    console.error("Analyze error:", error);
    return NextResponse.json(
      {
        error:
          "Analysis failed. Please try again in a moment. If the issue persists, try a different photo or URL.",
      },
      { status: 500 },
    );
  }
}
