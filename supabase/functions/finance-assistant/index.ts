
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, transactions } = await req.json();
    
    // Create Supabase client with admin privileges to fetch user's transactions
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Access DashScope API key from environment
    const DASHSCOPE_API_KEY = Deno.env.get('DASHSCOPE_API_KEY');
    if (!DASHSCOPE_API_KEY) {
      throw new Error('Missing DashScope API key');
    }

    // Initialize OpenAI compatible client for DashScope
    const systemPrompt = `
      You are a professional and considerate personal financial assistant. 
      
      Follow these guidelines:
      1. Analyze the user's financial data to provide personalized insights.
      2. Be empathetic and supportive when discussing financial challenges.
      3. Offer practical, actionable advice based on the user's spending patterns.
      4. Maintain a professional but friendly tone.
      5. Refer to specific transaction data when relevant to show personalization.
      6. Focus on helping the user improve their financial health.
      7. Never make up information - only use the data provided.
      8. If uncertain about something, acknowledge the limitation.
      
      You have access to the following financial data for reference:
      ${JSON.stringify(transactions)}
    `;

    // Make request to DashScope API (OpenAI compatible mode)
    const response = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DASHSCOPE_API_KEY}`
      },
      body: JSON.stringify({
        model: "qwen-max",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.7
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error("Error from DashScope:", result);
      throw new Error(`DashScope API error: ${result.error?.message || "Unknown error"}`);
    }

    return new Response(
      JSON.stringify({ 
        response: result.choices[0].message.content 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error("Error in finance-assistant function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
