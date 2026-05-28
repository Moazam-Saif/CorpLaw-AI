import { NextRequest } from "next/server";
import { prisma } from "../../../lib/prisma";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamObject } from "ai";
import { z } from "zod";
import { buildSystemPrompt } from "../../../lib/prompts";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export const maxDuration = 60; // Allow longer generation time

export async function POST(req: NextRequest) {
  try {
    const { sessionId, message, country } = await req.json();

    if (!sessionId || !message) {
      return new Response("Missing sessionId or message", { status: 400 });
    }

    // Load past messages
    const pastMessages = await prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
      take: 12,
    });

    const history: { role: "user" | "assistant"; content: string }[] = pastMessages.map((msg) => ({
      role: msg.role === "USER" ? "user" : "assistant",
      content: msg.content,
    }));

    // Update Session title
    if (pastMessages.length === 0) {
      const shortTitle = message.substring(0, 30) + (message.length > 30 ? "..." : "");
      await prisma.session.update({
        where: { id: sessionId },
        data: { title: shortTitle },
      });
    }

    // Save User message immediately
    await prisma.message.create({
      data: {
        sessionId,
        role: "USER",
        content: message,
      },
    });

    history.push({ role: "user", content: message });

    // Stream the structured object using the AI SDK
    const result = streamObject({
      model: google("gemini-2.5-flash"),
      system: buildSystemPrompt(country),
      messages: history,
      schema: z.object({
        sections: z.array(
          z.object({
            topic: z.string().describe("Short title of this section"),
            summary: z.string().describe("One-sentence overview of this section"),
            content: z.string().describe("Full markdown-formatted legal analysis"),
          })
        ),
        legalTerms: z.array(
          z.object({
            term: z.string(),
            definition: z.string(),
          })
        ).optional(),
        references: z.array(
          z.object({
            title: z.string(),
            url: z.string().optional(),
            description: z.string().optional(),
          })
        ).optional(),
        confidence: z.number().describe("0 to 100 integer confidence score"),
        disclaimer: z.string(),
      }),
      onFinish: async ({ object }) => {
        // Save the AI response when finished streaming
        if (object) {
          await prisma.message.create({
            data: {
              sessionId,
              role: "ASSISTANT",
              content: JSON.stringify(object),
            },
          });
        }
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Chat API Error:", error);
    return new Response("Failed to generate a response", { status: 500 });
  }
}