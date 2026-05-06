import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getGeminiResponse } from "../../../lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, message, country } = await req.json();

    if (!sessionId || !message) {
      return NextResponse.json({ error: "Missing sessionId or message" }, { status: 400 });
    }

    // Load past messages
    const pastMessages = await prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
      take: 12,
    });

    const history = pastMessages.map((msg) => ({
      role: msg.role === "USER" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    // Generate Gemini AI response
    const aiResponseData = await getGeminiResponse(history, message, country);

    // Save User message
    await prisma.message.create({
      data: {
        sessionId,
        role: "USER",
        content: message,
      },
    });

    // Save AI response
    const finalAnswer = `Confidence: ${aiResponseData.confidence}% \n\n ${aiResponseData.response}\n\n*${aiResponseData.disclaimer}*`;
    const aiMsg = await prisma.message.create({
      data: {
        sessionId,
        role: "ASSISTANT",
        content: finalAnswer,
      },
    });

    // Update Session title
    if (pastMessages.length === 0) {
      const shortTitle = message.substring(0, 30) + (message.length > 30 ? "..." : "");
      await prisma.session.update({
        where: { id: sessionId },
        data: { title: shortTitle },
      });
    }

    return NextResponse.json({ message: aiMsg });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Failed to generate a response" }, { status: 500 });
  }
}