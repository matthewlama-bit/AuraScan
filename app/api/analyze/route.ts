export const maxDuration = 60;

import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import { type ChatCompletionMessageParam } from "openai/resources/chat/completions";

// ...existing code... ChatCompletionMessageParam } from 'openai'; // Add this if not already imported

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export async function POST(req: Request) {
  try {
    const { images } = await req.json(); // Now expects an array of base64 images

    const options = {
      model: "gpt-4o",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `You are a precision moving surveyor. 
          TASK: Identify all furniture from the provided images of the same room, merge detections into a single consolidated list (combine quantities for identical items), and return coordinates (0-1000 scale) as [ymin, xmin, ymax, xmax] relative to each image.
          OUTPUT ONLY JSON: {"items": [{"item": "Name", "quantity": 1, "volume_per_unit": 0.5, "box_2d": [ymin, xmin, ymax, xmax]}, ...]}`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Perform a move survey on this room using the provided images." },
            ...images.map((image: string) => ({ type: "image_url", image_url: { url: image } }))
          ],
        }
      ] as ChatCompletionMessageParam[],
      response_format: { type: "json_object" as const },
    };
    
    // ...existing code...

    const response = await openai.chat.completions.create(options);
    const content = response.choices[0].message.content || "{}";
    
    return NextResponse.json(JSON.parse(content));
    
  } catch (error) {
    console.error("Analysis Error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to analyze image" }, 
      { status: 500 }
    );
  }
}