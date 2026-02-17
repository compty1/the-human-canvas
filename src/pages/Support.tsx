import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { FundingCard, FundingModal } from "@/components/funding";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Gift, GraduationCap, Users, Check, Code, Beaker, Package, Loader2 } from "lucide-react";

interface FundingCampaign {
  id: string;
  campaign_type: string;
  title: string;
  description: string | null;
  target_amount: number;
  raised_amount: number;
  project_id: string | null;
  status: string;
}

interface LearningGoal {
  id: string;
  title: string;
  description: string | null;
  target_amount: number | null;
  raised_amount: number | null;
  progress_percent: number | null;
}

const donationAmounts = [5, 10, 25, 50, 100];

const Support = () => {
  const queryClient = useQueryClient();
  const [selectedDonation, setSelectedDonation] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedLearning, setSelectedLearning] = useState<string | null>(null);
  const [generalDonationOpen, setGeneralDonationOpen] = useState(false);
  const [learningModalOpen, setLearningModalOpen] = useState(false);

  // Fetch funding campaigns
  const { data: campaigns = [], isLoading: loadingCampaigns } = useQuery({
    queryKey: ["funding-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("funding_campaigns")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as FundingCampaign[];
    },
  });

  // Fetch learning goals
  const { data: learningGoals = [], isLoading: loadingGoals } = useQuery({
    queryKey: ["learning-goals-support"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learning_goals")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as LearningGoal[];
    },
  });

  // Fetch thank you wall
  const { data: contributions = [] } = useQuery({
    queryKey: ["thank-you-wall"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contributions")
        .select("amount, message, created_at")
        .eq("show_publicly", true)
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data;
    },
  });

  // Group campaigns by type
  const developmentCampaigns = campaigns.filter(c => c.campaign_type === "development");
  const researchCampaigns = campaigns.filter(c => c.campaign_type === "research");

  const selectedLearningGoal = learningGoals.find(g => g.id === selectedLearning);

  return (
    <Layout>
      {/* Hero */}
      <section className="py-20 benday-dots">
        <div className="container mx-auto px-4">
          <div className="caption-box inline-block mb-4">Support</div>
          <h1 className="text-5xl md:text-7xl font-display gradient-text mb-6">
            Support the Journey
          </h1>
          <p className="text-xl font-sans max-w-2xl text-muted-foreground">
            Your contribution helps fund new projects, learning goals, and the
            continuous exploration of the human experience.
          </p>
        </div>
      </section>

      {/* Quick Donation */}
      <section className="py-16 screen-print">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* One-Time Donation */}
            <ComicPanel className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Gift className="w-8 h-8 text-primary" />
                <h3 className="text-2xl font-display">Donate</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                One-time support to help keep the work going.
              </p>

              <div className="grid grid-cols-3 gap-2 mb-4">
                {donationAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => {
                      setSelectedDonation(amount);
                      setCustomAmount("");
                    }}
                    className={`py-3 font-bold border-2 border-foreground transition-all ${
                      selectedDonation === amount
                        ? "bg-primary text-primary-foreground"
                        : "bg-background hover:bg-muted"
                    }`}
                  >
                    ${amount}
                  </button>
                ))}
                <input
                  type="number"
                  placeholder="Other"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setSelectedDonation(null);
                  }}
                  className="py-3 px-2 font-bold border-2 border-foreground bg-background text-center"
                />
              </div>

              <PopButton 
                variant="primary" 
                className="w-full justify-center"
                onClick={() => setGeneralDonationOpen(true)}
              >
                <Heart className="w-4 h-4 mr-2" />
                Donate{" "}
                {selectedDonation
                  ? `$${selectedDonation}`
                  : customAmount
                  ? `$${customAmount}`
                  : ""}
              </PopButton>
            </ComicPanel>

            {/* Fund Development */}
            <ComicPanel className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Code className="w-8 h-8 text-blue-600" />
                <h3 className="text-2xl font-display">Fund Development</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Support the programming and development of active projects.
              </p>

              {loadingCampaigns ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : developmentCampaigns.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No active development campaigns right now.
                </p>
              ) : (
                <div className="space-y-3">
                  {developmentCampaigns.slice(0, 3).map((campaign) => {
                    const progress = campaign.target_amount > 0 
                      ? (campaign.raised_amount / campaign.target_amount) * 100 
                      : 0;
                    return (
                      <div key={campaign.id} className="p-3 border-2 border-foreground bg-background">
                        <div className="font-bold text-sm">{campaign.title}</div>
                        <div className="mt-2 h-2 bg-muted overflow-hidden">
                          <div
                            className="h-full bg-blue-500"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          ${campaign.raised_amount} / ${campaign.target_amount}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ComicPanel>

            {/* Fund Learning */}
            <ComicPanel className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <GraduationCap className="w-8 h-8 text-accent" />
                <h3 className="text-2xl font-display">Fund Learning</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Contribute to specific learning goals and courses.
              </p>

              {loadingGoals ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-3 mb-6">
                  {learningGoals.slice(0, 3).map((goal) => (
                    <button
                      key={goal.id}
                      onClick={() => setSelectedLearning(goal.id)}
                      className={`w-full p-3 text-left border-2 border-foreground transition-all ${
                        selectedLearning === goal.id
                          ? "bg-accent"
                          : "bg-background hover:bg-muted"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold">{goal.title}</span>
                        <span className="text-sm">${goal.target_amount || 0}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <PopButton
                variant="accent"
                className="w-full justify-center"
                disabled={!selectedLearning}
                onClick={() => setLearningModalOpen(true)}
              >
                <Heart className="w-4 h-4 mr-2" />
                Fund This Course
              </PopButton>
            </ComicPanel>
          </div>
        </div>
      </section>

      {/* Fund Research Section */}
      {researchCampaigns.length > 0 && (
        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <Beaker className="w-8 h-8 text-purple-600" />
              <h2 className="text-4xl font-display">Fund Research</h2>
            </div>
            <p className="text-muted-foreground mb-8 max-w-2xl">
              Support research initiatives that drive innovation and discovery.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {researchCampaigns.map((campaign) => (
                <FundingCard
                  key={campaign.id}
                  id={campaign.id}
                  type="research"
                  title={campaign.title}
                  description={campaign.description || ""}
                  targetAmount={campaign.target_amount}
                  raisedAmount={campaign.raised_amount}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Thank You Wall */}
      <section className="py-16 bg-foreground text-background">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-display text-pop-yellow text-center mb-4">
            Thank You Wall
          </h2>
          <p className="text-center opacity-80 max-w-xl mx-auto mb-12">
            Gratitude to everyone who has contributed to the journey. 💛
          </p>

          {contributions.length === 0 ? (
            <p className="text-center opacity-60">
              Be the first to appear on the Thank You wall!
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
               {contributions.map((contributor, index) => (
                <div
                  key={`contribution-${index}-${contributor.created_at}`}
                  className="p-4 border-2 border-background text-center"
                >
                  <div className="text-2xl font-display text-pop-cyan mb-2">
                    ${contributor.amount}
                  </div>
                  <div className="font-bold">Supporter</div>
                  {contributor.message && (
                    <p className="text-sm opacity-80 mt-1">"{contributor.message}"</p>
                  )}
                </div>
              ))}
            </div>
          )}

          <p className="text-center text-sm opacity-60 mt-8">
            Want to appear here? Opt-in when you contribute!
          </p>
        </div>
      </section>

      {/* Where Your Support Goes */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-display text-center mb-8">
              Where Your Support Goes
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: "Projects",
                  description: "Hosting, tools, and development time for live and in-progress projects.",
                  percentage: 50,
                },
                {
                  title: "Learning",
                  description: "Courses, certifications, and resources to expand skills.",
                  percentage: 30,
                },
                {
                  title: "Creation",
                  description: "Art supplies, software, and time to create new work.",
                  percentage: 20,
                },
              ].map((item) => (
                <ComicPanel key={item.title} className="p-6 text-center">
                  <div className="text-4xl font-display text-primary mb-2">
                    {item.percentage}%
                  </div>
                  <h3 className="text-xl font-display mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </ComicPanel>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Note about Stripe */}
      <section className="py-8 bg-muted">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            🔒 Secure payments powered by Stripe. Payment processing will be
            enabled soon!
          </p>
        </div>
      </section>

      {/* General Donation Modal */}
      <FundingModal
        open={generalDonationOpen}
        onOpenChange={setGeneralDonationOpen}
        title="Make a Donation"
        description="Your contribution supports ongoing projects and creative work."
        contributionType="general"
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["thank-you-wall"] })}
      />

      {/* Learning Goal Modal */}
      {selectedLearningGoal && (
        <FundingModal
          open={learningModalOpen}
          onOpenChange={setLearningModalOpen}
          title={`Fund: ${selectedLearningGoal.title}`}
          description={selectedLearningGoal.description || undefined}
          targetId={selectedLearningGoal.id}
          contributionType="research"
        />
      )}
    </Layout>
  );
};

export default Support;
