export const maxDuration = 60;

import { OpenAI } from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export async function POST(req: Request) {
  try {
    const { image } = await req.json();

    const options: any = {
      model: "gpt-4o",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `You are a precision moving surveyor. 
          TASK: Identify all furniture and return coordinates (0-1000 scale) as [ymin, xmin, ymax, xmax].
          OUTPUT ONLY JSON: {"items": [{"item": "Name", "quantity": 1, "volume_per_unit": 0.5, "box_2d": [ymin, xmin, ymax, xmax]}]}`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Perform a move survey on this room." },
            { type: "image_url", image_url: { url: image } }
          ],
        }
      ],
      response_format: { type: "json_object" },
    };

    const response = await openai.chat.completions.create(options);
    const content = response.choices[0].message.content || "{}";
    
    return NextResponse.json(JSON.parse(content));
    
  } catch (error: any) {
    console.error("Analysis Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze image" }, 
      { status: 500 }
    );
  }
}