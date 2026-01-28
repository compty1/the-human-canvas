import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ProductAnalysisResult {
  product_name: string;
  company: string;
  category: string;
  overall_rating: number;
  summary: string;
  pain_points: string[];
  strengths: string[];
  technical_issues: string[];
  improvement_suggestions: string[];
  future_recommendations: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the product page
    let pageContent = "";
    let pageTitle = "";
    let metaDescription = "";

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });
      
      if (response.ok) {
        const html = await response.text();
        
        // Extract title
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        pageTitle = titleMatch ? titleMatch[1].trim() : "";
        
        // Extract meta description
        const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
        metaDescription = descMatch ? descMatch[1].trim() : "";
        
        // Extract visible text (simplified)
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch) {
          // Remove scripts, styles, and HTML tags
          pageContent = bodyMatch[1]
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 10000); // Limit content
        }
      }
    } catch (e) {
      console.log("Failed to fetch page:", e);
    }

    // Extract product name and company from title
    let productName = pageTitle.split(/[-|–—]/)[0]?.trim() || "";
    let company = "";
    
    // Try to extract company from URL domain
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace("www.", "");
      company = domain.split(".")[0];
      company = company.charAt(0).toUpperCase() + company.slice(1);
    } catch (e) {
      console.log("Could not parse URL:", e);
    }

    // Use AI for comprehensive UX analysis
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert UX/product analyst. Analyze the provided product information and create a comprehensive UX review.

Return a valid JSON object with exactly these fields:
{
  "product_name": "string - the actual product name",
  "company": "string - the company name",
  "category": "string - one of: Medical Device, Consumer Product, Software, Mobile App, Web Service, Hardware, IoT Device",
  "overall_rating": number 1-10,
  "summary": "string - 2-3 sentence executive summary",
  "pain_points": ["array of 3-5 user pain points and frustrations"],
  "strengths": ["array of 3-5 product strengths"],
  "technical_issues": ["array of 2-4 technical problems if any"],
  "improvement_suggestions": ["array of 3-5 specific improvement suggestions"],
  "future_recommendations": ["array of 2-4 future feature recommendations"]
}

Be specific and actionable in your analysis. If information is limited, make reasonable inferences based on the product type and industry standards.
Only return valid JSON, no markdown or explanation.`
          },
          {
            role: "user",
            content: `Analyze this product for a UX review:

URL: ${url}
Page Title: ${pageTitle}
Meta Description: ${metaDescription}
Product Name (inferred): ${productName}
Company (inferred): ${company}

Page Content:
${pageContent.slice(0, 6000)}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI response error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add credits" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI analysis failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiText = await aiResponse.text();
    let analysis: ProductAnalysisResult;

    try {
      const aiData = JSON.parse(aiText);
      const content = aiData.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("No content in AI response");
      }
      
      // Clean and parse the JSON
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      analysis = JSON.parse(cleaned);
    } catch (e) {
      console.error("Failed to parse AI response:", e, aiText);
      
      // Return a basic analysis if AI parsing fails
      analysis = {
        product_name: productName || "Unknown Product",
        company: company || "Unknown Company",
        category: "Consumer Product",
        overall_rating: 5,
        summary: metaDescription || "Unable to generate summary. Please add details manually.",
        pain_points: [],
        strengths: [],
        technical_issues: [],
        improvement_suggestions: [],
        future_recommendations: [],
      };
    }

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("analyze-product error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
