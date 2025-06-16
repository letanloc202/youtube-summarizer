import { NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request) {
  try {
    const { transcript, language, languageCode } = await request.json();

    if (!transcript) {
      return NextResponse.json(
        { error: "Transcript is required" },
        { status: 400 }
      );
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    console.log(
      "Transcript to summarize:",
      transcript.substring(0, 200) + "..."
    );
    console.log("Language:", language, "Code:", languageCode);

    // Create a streaming response
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const chatModel = new ChatOpenAI({
            openAIApiKey: OPENAI_API_KEY,
            modelName: "gpt-4o-mini",
            streaming: true,
            callbacks: [
              {
                handleLLMNewToken(token) {
                  const chunk = encoder.encode(token);
                  controller.enqueue(chunk);
                },
              },
            ],
          });

          const detectedLanguage = language || "English";
          const systemMessage = new SystemMessage(`
            You are a helpful assistant that summarizes YouTube video content.
            Please provide a clear, concise summary of the video content.
            Include the main points, key insights, and any important takeaways.
            
            IMPORTANT: The transcript is in ${detectedLanguage}. You MUST respond in the SAME language (${detectedLanguage}). 
            Do not translate or change the language of your response. Keep the same language as the original transcript.
            
            Structure your summary with:
            1. Main Topic/Subject
            2. Key Points (3-5 bullet points)
            3. Important Insights
            4. Conclusion/Takeaways
            
            Use markdown formatting for better readability.
          `);

          const humanMessage = new HumanMessage(`
            Please summarize this YouTube video transcript in ${detectedLanguage}:
            
            ${transcript.substring(0, 12000)} // Limit to avoid token limits
          `);

          await chatModel.invoke([systemMessage, humanMessage]);

          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          const errorMessage = encoder.encode(`Error: ${error.message}`);
          controller.enqueue(errorMessage);
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
