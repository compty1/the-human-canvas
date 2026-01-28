import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface GitHubAnalysisResult {
  title: string;
  description: string;
  long_description: string;
  tech_stack: string[];
  features: string[];
  problem_statement: string;
  solution_summary: string;
  external_url: string;
  github_stats: {
    stars: number;
    forks: number;
    watchers: number;
    open_issues: number;
    language: string | null;
    created_at: string;
    updated_at: string;
    license: string | null;
  };
}

function extractOwnerRepo(url: string): { owner: string; repo: string } | null {
  // Match patterns like github.com/owner/repo or github.com/owner/repo.git
  const match = url.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
  if (match) {
    return { owner: match[1], repo: match[2] };
  }
  return null;
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

    const parsed = extractOwnerRepo(url);
    if (!parsed) {
      return new Response(
        JSON.stringify({ error: "Invalid GitHub URL format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { owner, repo } = parsed;

    // Fetch repository info
    const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Lovable-App",
      },
    });

    if (!repoResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch repository information" }),
        { status: repoResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const repoData = await repoResponse.json();

    // Fetch README
    let readmeContent = "";
    try {
      const readmeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
        headers: {
          "Accept": "application/vnd.github.v3+json",
          "User-Agent": "Lovable-App",
        },
      });
      if (readmeResponse.ok) {
        const readmeData = await readmeResponse.json();
        // README is base64 encoded
        readmeContent = atob(readmeData.content.replace(/\n/g, ""));
      }
    } catch (e) {
      console.log("Could not fetch README:", e);
    }

    // Fetch languages
    let languages: string[] = [];
    try {
      const langResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, {
        headers: {
          "Accept": "application/vnd.github.v3+json",
          "User-Agent": "Lovable-App",
        },
      });
      if (langResponse.ok) {
        const langData = await langResponse.json();
        languages = Object.keys(langData);
      }
    } catch (e) {
      console.log("Could not fetch languages:", e);
    }

    // Fetch package.json for dependencies (tech stack)
    let techStack: string[] = [...languages];
    try {
      const pkgResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/package.json`, {
        headers: {
          "Accept": "application/vnd.github.v3+json",
          "User-Agent": "Lovable-App",
        },
      });
      if (pkgResponse.ok) {
        const pkgData = await pkgResponse.json();
        const pkgContent = JSON.parse(atob(pkgData.content.replace(/\n/g, "")));
        const deps = Object.keys(pkgContent.dependencies || {});
        const devDeps = Object.keys(pkgContent.devDependencies || {});
        
        // Extract notable frameworks/libraries
        const notablePackages = [
          "react", "vue", "angular", "svelte", "next", "nuxt", "gatsby",
          "express", "fastify", "koa", "nest", "hono",
          "tailwindcss", "styled-components", "emotion",
          "prisma", "drizzle", "typeorm", "sequelize",
          "supabase", "firebase", "aws-sdk",
          "typescript", "vite", "webpack", "esbuild"
        ];
        
        [...deps, ...devDeps].forEach(dep => {
          const match = notablePackages.find(n => dep.includes(n));
          if (match && !techStack.includes(match)) {
            techStack.push(match.charAt(0).toUpperCase() + match.slice(1));
          }
        });
      }
    } catch (e) {
      console.log("Could not fetch package.json:", e);
    }

    // Use AI to extract structured information from README
    let aiAnalysis: Record<string, unknown> = {};
    try {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (LOVABLE_API_KEY && readmeContent) {
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
                content: `You are a project analyzer. Extract structured information from GitHub README content. Return a valid JSON object with these fields:
- long_description: A detailed description of the project (2-3 paragraphs)
- features: An array of key features (strings)
- problem_statement: What problem does this project solve?
- solution_summary: How does this project solve the problem?

Only return valid JSON, no markdown or explanation.`
              },
              {
                role: "user",
                content: `Analyze this README and extract project information:\n\n${readmeContent.slice(0, 8000)}`
              }
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiText = await aiResponse.text();
          try {
            const aiData = JSON.parse(aiText);
            const content = aiData.choices?.[0]?.message?.content;
            if (content) {
              // Try to parse the content as JSON
              const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
              aiAnalysis = JSON.parse(cleaned);
            }
          } catch (e) {
            console.log("Could not parse AI response:", e);
          }
        }
      }
    } catch (e) {
      console.log("AI analysis failed:", e);
    }

    // Extract features from README sections if AI didn't provide them
    let features = (aiAnalysis.features as string[]) || [];
    if (features.length === 0 && readmeContent) {
      // Simple feature extraction from bullet points under "Features" section
      const featuresMatch = readmeContent.match(/##?\s*Features?\s*\n([\s\S]*?)(?=\n##|\n#|$)/i);
      if (featuresMatch) {
        const lines = featuresMatch[1].split("\n");
        features = lines
          .filter(line => line.match(/^[\s]*[-*•]/))
          .map(line => line.replace(/^[\s]*[-*•]\s*/, "").trim())
          .filter(Boolean)
          .slice(0, 10);
      }
    }

    const result: GitHubAnalysisResult = {
      title: repoData.name.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
      description: repoData.description || "",
      long_description: (aiAnalysis.long_description as string) || repoData.description || "",
      tech_stack: [...new Set(techStack)],
      features,
      problem_statement: (aiAnalysis.problem_statement as string) || "",
      solution_summary: (aiAnalysis.solution_summary as string) || "",
      external_url: repoData.html_url,
      github_stats: {
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        watchers: repoData.watchers_count,
        open_issues: repoData.open_issues_count,
        language: repoData.language,
        created_at: repoData.created_at,
        updated_at: repoData.updated_at,
        license: repoData.license?.name || null,
      },
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("analyze-github error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
