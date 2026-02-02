import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { 
  Award, 
  ExternalLink, 
  Calendar, 
  Loader2,
  Heart,
  CheckCircle,
  Clock,
  Target,
  Sparkles
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

const statusIcons: Record<string, React.ElementType> = {
  earned: CheckCircle,
  in_progress: Clock,
  planned: Target,
  wanted: Sparkles,
};

const statusColors: Record<string, string> = {
  earned: "bg-green-500",
  in_progress: "bg-yellow-500",
  planned: "bg-blue-500",
  wanted: "bg-purple-500",
};

const Certifications = () => {
  const [activeStatus, setActiveStatus] = useState("all");

  const { data: certifications = [], isLoading } = useQuery({
    queryKey: ["certifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certifications")
        .select("*")
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const statuses = ["all", "earned", "in_progress", "planned", "wanted"];
  const filteredCertifications = activeStatus === "all"
    ? certifications
    : certifications.filter(c => c.status === activeStatus);

  const earnedCerts = certifications.filter(c => c.status === "earned");
  const inProgressCerts = certifications.filter(c => c.status === "in_progress");
  const plannedCerts = certifications.filter(c => c.status === "planned" || c.status === "wanted");

  return (
    <Layout>
      {/* Hero */}
      <section className="py-20 benday-dots">
        <div className="container mx-auto px-4">
          <div className="caption-box inline-block mb-4">Credentials</div>
          <h1 className="text-5xl md:text-7xl font-display gradient-text mb-6 flex items-center gap-4">
            <Award className="w-12 h-12" />
            Certifications
          </h1>
          <p className="text-xl font-sans max-w-2xl text-muted-foreground">
            Professional certifications earned, in progress, and planned. 
            Help support my continued learning by sponsoring a certification.
          </p>
        </div>
      </section>

      {/* Status Filters */}
      <section className="py-8 border-b-2 border-foreground sticky top-16 bg-background z-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-3 justify-center">
            {statuses.map((status) => {
              const Icon = status === "all" ? Award : statusIcons[status];
              const count = status === "all" 
                ? certifications.length 
                : certifications.filter(c => c.status === status).length;
              return (
                <button
                  key={status}
                  onClick={() => setActiveStatus(status)}
                  className={`px-4 py-2 font-bold text-sm uppercase flex items-center gap-2 border-2 transition-colors ${
                    activeStatus === status
                      ? status === "all" 
                        ? "bg-foreground text-background border-foreground"
                        : `${statusColors[status]} text-white border-foreground`
                      : "border-foreground hover:bg-muted"
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {status === "all" ? "All" : status.replace("_", " ")} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Certifications Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : filteredCertifications.length === 0 ? (
            <div className="text-center py-12">
              <Award className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-display mb-2">No certifications in this category yet</h2>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCertifications.map((cert) => {
                const Icon = statusIcons[cert.status || "planned"] || Award;
                const fundingProgress = cert.estimated_cost 
                  ? ((cert.funded_amount || 0) / cert.estimated_cost) * 100 
                  : 0;
                
                return (
                  <ComicPanel key={cert.id} className="h-full flex flex-col">
                    {/* Image */}
                    {cert.image_url && (
                      <div className="aspect-video overflow-hidden border-b-4 border-foreground bg-muted flex items-center justify-center">
                        <img
                          src={cert.image_url}
                          alt={cert.name}
                          className="w-full h-full object-contain p-4"
                        />
                      </div>
                    )}

                    <div className="p-6 flex-1 flex flex-col">
                      {/* Status Badge */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-2 py-1 text-xs font-bold text-white flex items-center gap-1 ${statusColors[cert.status || "planned"]}`}>
                          <Icon className="w-3 h-3" />
                          {cert.status?.replace("_", " ")}
                        </span>
                        {cert.category && (
                          <span className="px-2 py-1 text-xs font-bold bg-muted capitalize">
                            {cert.category}
                          </span>
                        )}
                      </div>

                      {/* Title & Issuer */}
                      <h3 className="text-xl font-display mb-1">{cert.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{cert.issuer}</p>

                      {/* Description */}
                      {cert.description && (
                        <p className="text-muted-foreground mb-4 line-clamp-2 flex-1">
                          {cert.description}
                        </p>
                      )}

                      {/* Skills */}
                      {cert.skills && cert.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {cert.skills.slice(0, 3).map((skill) => (
                            <span key={skill} className="px-2 py-0.5 bg-muted text-xs font-bold">
                              {skill}
                            </span>
                          ))}
                          {cert.skills.length > 3 && (
                            <span className="px-2 py-0.5 bg-muted text-xs font-bold">
                              +{cert.skills.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Earned Date */}
                      {cert.status === "earned" && cert.earned_date && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                          <Calendar className="w-4 h-4" />
                          Earned {new Date(cert.earned_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </div>
                      )}

                      {/* Funding Progress */}
                      {cert.funding_enabled && cert.estimated_cost && cert.status !== "earned" && (
                        <div className="mt-auto pt-4 border-t border-muted">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Funding</span>
                            <span className="font-bold">
                              ${cert.funded_amount || 0} / ${cert.estimated_cost}
                            </span>
                          </div>
                          <Progress value={fundingProgress} className="h-2 mb-3" />
                          <Link to="/support">
                            <PopButton size="sm" className="w-full">
                              <Heart className="w-4 h-4 mr-2" />
                              Sponsor This Certification
                            </PopButton>
                          </Link>
                        </div>
                      )}

                      {/* Credential Link */}
                      {cert.status === "earned" && cert.credential_url && (
                        <a 
                          href={cert.credential_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="mt-auto"
                        >
                          <PopButton size="sm" variant="secondary" className="w-full">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Verify Credential
                          </PopButton>
                        </a>
                      )}
                    </div>
                  </ComicPanel>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-foreground text-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-display text-pop-yellow mb-4">Support Continued Learning</h2>
          <p className="text-lg max-w-xl mx-auto mb-8 opacity-80">
            Help fund my professional development by sponsoring a certification. 
            Your contribution supports ongoing education and skill building.
          </p>
          <Link to="/support">
            <PopButton variant="accent" size="lg">
              <Heart className="w-5 h-5 mr-2" />
              Become a Sponsor
            </PopButton>
          </Link>
        </div>
      </section>
    </Layout>
  );
};

export default Certifications;
