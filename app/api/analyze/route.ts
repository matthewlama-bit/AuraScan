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

    // To make multi-image scanning reliable across SDK/formatting differences,
    // analyze each image individually and merge results server-side.
    const perImageResults: Array<any[]> = [];

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const opts = {
        model: "gpt-4o",
        temperature: 0,
        messages: [
          {
            role: "system",
            content: `You are a precision moving surveyor.\nTASK: Identify all furniture visible in the provided single image and return JSON only.\nOUTPUT: {"items": [{"item": "Name", "quantity": 1, "volume_per_unit": 0.5, "box_2d": [ymin, xmin, ymax, xmax]}]}`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: `Image index: ${i}. Return detections for this image only.` },
              { type: "image_url", image_url: { url: img } }
            ],
          }
        ],
        response_format: { type: "json_object" as const },
      } as any;

      const res = await openai.chat.completions.create(opts as any);
      const raw = res.choices?.[0]?.message?.content || "{}";
      let parsed: any = {};
      try {
        parsed = JSON.parse(raw as string);
      } catch (e) {
        // If parsing fails, continue with empty items for this image
        console.error(`Failed to parse model output for image ${i}`, e, raw);
        parsed = { items: [] };
      }

      const items: any[] = Array.isArray(parsed.items) ? parsed.items : [];
      // Attach source index so downstream code can choose how to draw boxes
      const annotated = items.map(it => ({ ...it, _source_image: i }));
      perImageResults.push(annotated);
    }

    // Merge items by normalized name (case-insensitive)
    const merged: Record<string, any> = {};
    for (const items of perImageResults) {
      for (const it of items) {
        const name = (it.item || "").toString().trim().toLowerCase();
        if (!name) continue;
        if (!merged[name]) {
          merged[name] = { ...it };
          // keep array of boxes found across images
          merged[name].box_2d = it.box_2d ? [it.box_2d] : [];
          merged[name].sources = [{ image: it._source_image, box: it.box_2d }];
        } else {
          merged[name].quantity = (merged[name].quantity || 0) + (it.quantity || 1);
          if (it.box_2d) merged[name].box_2d.push(it.box_2d);
          merged[name].sources.push({ image: it._source_image, box: it.box_2d });
        }
      }
    }

    const out = { items: Object.values(merged) };
    return NextResponse.json(out);
    
  } catch (error) {
    console.error("Analysis Error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to analyze image" }, 
      { status: 500 }
    );
  }
}