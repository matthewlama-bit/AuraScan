import { OpenAI } from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { image } = await req.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0, 
      messages: [
        {
          role: "system",
          content: `You are a precision moving surveyor. 
          
          TASK:
          1. Mentally overlay a 10x10 grid on the image to locate objects accurately.
          2. Conduct a deep-scan of the room. Identify ALL furniture, including small items (lamps, rugs, art, boxes, plants).
          
          COORDINATES:
          - Use a 0-1000 scale. [0,0] is TOP-LEFT. [1000,1000] is BOTTOM-RIGHT.
          - Return the coordinates as [ymin, xmin, ymax, xmax].
          
          OUTPUT:
          Return ONLY a JSON object:
          {"items": [{"item": "Name", "quantity": 1, "volume_per_unit": 0.5, "box_2d": [ymin, xmin, ymax, xmax]}]}
          
          Do not stop until you have identified at least 10-15 items if they are present.`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this image for a white-glove relocation. List every single item with high-precision bounding boxes." },
            { type: "image_url", image_url: { url: image, detail: "high" } } // "high" forces the model to look at 512px tiles for detail
          ],
        },
      ],
    });

    let content = response.choices[0].message.content || "{}";
    content = content.replace(/```json|```/g, "").trim();
    
    return NextResponse.json(JSON.parse(content));
  } catch (error: any) {
    return NextResponse.json({ items: [], error: error.message }, { status: 500 });
  }
}