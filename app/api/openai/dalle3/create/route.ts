// app/api/openai/dalle3/create/route.ts
import { createServer } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { Dalle3Params } from "@/types/openai/dalle";
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Dalle3Params;
    const { 
      prompt, 
      model = "dall-e-3", 
      size = "1024x1024", 
      quality = "standard", 
      style = "vivid",
      response_format = "url",
      n = 1,
      user
    } = body;
    
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }
    
    // OpenAI API direct call
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model,
        prompt,
        n,
        size,
        quality,
        style,
        response_format,
        user
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: "OpenAI API error", details: errorData }, { status: response.status });
    }
    
    const imageData = await response.json();
    const imageUrl = imageData.data[0]?.url;
    
    if (!imageUrl) {
      return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
    }
    
    // Download image from OpenAI
    const imageResponse = await fetch(imageUrl);
    const imageBlob = await imageResponse.blob();
    
    // Upload to OpenAI as a file for assistant use
    const formData = new FormData();
    formData.append("file", imageBlob, "dalle-image.png");
    formData.append("purpose", "assistants");
    
    const fileResponse = await fetch("https://api.openai.com/v1/files", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: formData
    });
    
    if (!fileResponse.ok) {
      const errorData = await fileResponse.json();
      return NextResponse.json({ error: "Failed to upload to OpenAI", details: errorData }, { status: fileResponse.status });
    }
    
    const fileData = await fileResponse.json();
    const openaiFileId = fileData.id;
    
    // Upload to Supabase storage
    const supabase = await createServer();
    const fileName = `dalle-${Date.now()}.png`;
    const { data: storageData, error: storageError } = await supabase.storage
      .from("dalle-images")
      .upload(fileName, imageBlob);
    
    if (storageError) {
      return NextResponse.json({ error: "Failed to upload to storage", details: storageError }, { status: 500 });
    }
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("dalle-images")
      .getPublicUrl(fileName);
    
    // Save record to database
    const { data: recordData, error: recordError } = await supabase
      .from("dalle_images")
      .insert({
        prompt,
        model,
        openai_file_id: openaiFileId,
        storage_path: fileName,
        public_url: publicUrlData.publicUrl,
        size,
        quality,
        style,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (recordError) {
      return NextResponse.json({ error: "Failed to save record", details: recordError }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        imageUrl: publicUrlData.publicUrl,
        openaiFileId,
        record: recordData
      }
    });
    
  } catch (error) {
    console.error("DALL-E image generation error:", error);
    return NextResponse.json({ error: "Failed to process image generation", }, { status: 500 });
  }
}