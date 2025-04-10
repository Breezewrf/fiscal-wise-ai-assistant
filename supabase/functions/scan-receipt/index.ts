
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const DASHSCOPE_API_KEY = Deno.env.get("DASHSCOPE_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!DASHSCOPE_API_KEY) {
      throw new Error("DASHSCOPE_API_KEY is not set");
    }

    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call DashScope API with a structured prompt
    const response = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DASHSCOPE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen2-vl-7b-instruct",
        messages: [
          {
            role: "system",
            content: [
              {
                type: "text",
                text: `You are a receipt scanning assistant. Analyze the receipt image and extract the following information in JSON format ONLY:
                {
                  "merchant": "Store or business name",
                  "amount": "Total amount as a number without currency symbols",
                  "date": "Date in YYYY-MM-DD format",
                  "items": ["Item 1", "Item 2", "...etc"],
                  "category": "One of: Food & Dining, Shopping, Transportation, Entertainment, Utilities, Housing, Health, Education, Travel, Other"
                }
                
                If you can't determine a value, use null. Don't include any explanations, just the JSON.`
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  "url": `data:image/jpeg;base64,${imageBase64}`
                }
              },
              {
                type: "text",
                text: "Extract the receipt information into the required JSON format."
              }
            ]
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("DashScope API error:", errorData);
      throw new Error(`DashScope API error: ${response.status}`);
    }

    const data = await response.json();
    const extractedText = data.choices[0].message.content;

    // Try to parse the response as JSON (the prompt asks for JSON format)
    let extractedData;
    try {
      // Find JSON in the response (in case the model includes extra text)
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not find JSON in response");
      }
    } catch (e) {
      console.error("Failed to parse JSON from model response:", e);
      console.log("Raw response:", extractedText);
      
      // Return a generic error with some parsed fields if possible
      return new Response(
        JSON.stringify({
          error: "Failed to parse receipt data",
          rawText: extractedText
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 422 }
      );
    }

    return new Response(
      JSON.stringify({ data: extractedData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in scan-receipt function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
