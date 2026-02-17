import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function verifyAdmin(req: Request): Promise<boolean> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return false;
  const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
  return !!isAdmin;
}

function extractOwnerRepo(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
  return match ? { owner: match[1], repo: match[2] } : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!(await verifyAdmin(req))) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = extractOwnerRepo(url);
    if (!parsed) {
      return new Response(JSON.stringify({ error: "Invalid GitHub URL format" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { owner, repo } = parsed;
    const ghHeaders = { "Accept": "application/vnd.github.v3+json", "User-Agent": "Lovable-App" };

    const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers: ghHeaders });
    if (!repoResponse.ok) {
      return new Response(JSON.stringify({ error: "Failed to fetch repository information" }), {
        status: repoResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const repoData = await repoResponse.json();

    let readmeContent = "";
    try {
      const readmeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, { headers: ghHeaders });
      if (readmeResponse.ok) {
        const readmeData = await readmeResponse.json();
        readmeContent = atob(readmeData.content.replace(/\n/g, ""));
      }
    } catch {}

    let languages: string[] = [];
    try {
      const langResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, { headers: ghHeaders });
      if (langResponse.ok) languages = Object.keys(await langResponse.json());
    } catch {}

    let techStack: string[] = [...languages];
    try {
      const pkgResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/package.json`, { headers: ghHeaders });
      if (pkgResponse.ok) {
        const pkgData = await pkgResponse.json();
        const pkgContent = JSON.parse(atob(pkgData.content.replace(/\n/g, "")));
        const deps = Object.keys(pkgContent.dependencies || {});
        const devDeps = Object.keys(pkgContent.devDependencies || {});
        const notablePackages = ["react","vue","angular","svelte","next","nuxt","express","tailwindcss","prisma","supabase","firebase","typescript","vite"];
        [...deps, ...devDeps].forEach(dep => {
          const match = notablePackages.find(n => dep.includes(n));
          if (match && !techStack.includes(match)) techStack.push(match.charAt(0).toUpperCase() + match.slice(1));
        });
      }
    } catch {}

    let aiAnalysis: Record<string, unknown> = {};
    try {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (LOVABLE_API_KEY && readmeContent) {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: `Extract structured info from GitHub README. Return valid JSON with: long_description, features (array), problem_statement, solution_summary. Only valid JSON.` },
              { role: "user", content: `Analyze:\n\n${readmeContent.slice(0, 8000)}` }
            ],
          }),
        });
        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content;
          if (content) {
            const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            aiAnalysis = JSON.parse(cleaned);
          }
        }
      }
    } catch {}

    let features = (aiAnalysis.features as string[]) || [];
    if (features.length === 0 && readmeContent) {
      const featuresMatch = readmeContent.match(/##?\s*Features?\s*\n([\s\S]*?)(?=\n##|\n#|$)/i);
      if (featuresMatch) {
        features = featuresMatch[1].split("\n")
          .filter(line => line.match(/^[\s]*[-*•]/))
          .map(line => line.replace(/^[\s]*[-*•]\s*/, "").trim())
          .filter(Boolean).slice(0, 10);
      }
    }

    return new Response(JSON.stringify({
      title: repoData.name.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
      description: repoData.description || "",
      long_description: (aiAnalysis.long_description as string) || repoData.description || "",
      tech_stack: [...new Set(techStack)],
      features,
      problem_statement: (aiAnalysis.problem_statement as string) || "",
      solution_summary: (aiAnalysis.solution_summary as string) || "",
      external_url: repoData.html_url,
      github_stats: {
        stars: repoData.stargazers_count, forks: repoData.forks_count,
        watchers: repoData.watchers_count, open_issues: repoData.open_issues_count,
        language: repoData.language, created_at: repoData.created_at,
        updated_at: repoData.updated_at, license: repoData.license?.name || null,
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("analyze-github error:", error);
    return new Response(
      JSON.stringify({ error: "An internal error occurred." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
