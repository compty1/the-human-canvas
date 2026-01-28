import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, PopButton, SpeechBubble } from "@/components/pop-art";
import { Heart, Gift, GraduationCap, Users, Check } from "lucide-react";

const donationAmounts = [5, 10, 25, 50, 100];

interface SponsorableProject {
  id: string;
  title: string;
  description: string;
  fundingGoal: number;
  fundingRaised: number;
}

const sponsorableProjects: SponsorableProject[] = [
  {
    id: "t1d-compass",
    title: "T1D Compass",
    description: "Type 1 Diabetes management and community tool",
    fundingGoal: 5000,
    fundingRaised: 1250,
  },
  {
    id: "pulse-network",
    title: "Pulse Network",
    description: "Social change organizing platform",
    fundingGoal: 7500,
    fundingRaised: 2100,
  },
  {
    id: "ux-lens",
    title: "UX Lens",
    description: "Product experience case studies",
    fundingGoal: 3000,
    fundingRaised: 450,
  },
];

const learningGoals = [
  { id: "ai-ml", title: "AI/ML Course", amount: 500 },
  { id: "ux-cert", title: "UX Certification", amount: 800 },
  { id: "3d-art", title: "3D Modeling", amount: 400 },
];

const thankYouWall = [
  { name: "Anonymous", message: "Keep creating!", amount: 25 },
  { name: "Sarah M.", message: "Love your T1D work", amount: 50 },
  { name: "Tech Enthusiast", message: "Supporting innovation", amount: 100 },
  { name: "Art Lover", message: "Beautiful portraits!", amount: 10 },
];

const Support = () => {
  const [selectedDonation, setSelectedDonation] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedLearning, setSelectedLearning] = useState<string | null>(null);

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

      {/* Donation Options */}
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

              <PopButton variant="primary" className="w-full justify-center">
                <Heart className="w-4 h-4 mr-2" />
                Donate{" "}
                {selectedDonation
                  ? `$${selectedDonation}`
                  : customAmount
                  ? `$${customAmount}`
                  : ""}
              </PopButton>
            </ComicPanel>

            {/* Sponsor a Project */}
            <ComicPanel className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-8 h-8 text-secondary" />
                <h3 className="text-2xl font-display">Sponsor Project</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Fund a specific in-progress project.
              </p>

              <div className="space-y-3 mb-6">
                {sponsorableProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProject(project.id)}
                    className={`w-full p-3 text-left border-2 border-foreground transition-all ${
                      selectedProject === project.id
                        ? "bg-secondary"
                        : "bg-background hover:bg-muted"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold">{project.title}</span>
                      {selectedProject === project.id && (
                        <Check className="w-5 h-5" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {project.description}
                    </p>
                    <div className="mt-2 h-2 bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${
                            (project.fundingRaised / project.fundingGoal) * 100
                          }%`,
                        }}
                      />
                    </div>
                  </button>
                ))}
              </div>

              <PopButton
                variant="secondary"
                className="w-full justify-center"
                disabled={!selectedProject}
              >
                <Heart className="w-4 h-4 mr-2" />
                Sponsor This Project
              </PopButton>
            </ComicPanel>

            {/* Fund a Class */}
            <ComicPanel className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <GraduationCap className="w-8 h-8 text-accent" />
                <h3 className="text-2xl font-display">Fund Learning</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Contribute to specific learning goals and courses.
              </p>

              <div className="space-y-3 mb-6">
                {learningGoals.map((goal) => (
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
                      <span className="text-sm">${goal.amount}</span>
                    </div>
                  </button>
                ))}
              </div>

              <PopButton
                variant="accent"
                className="w-full justify-center"
                disabled={!selectedLearning}
              >
                <Heart className="w-4 h-4 mr-2" />
                Fund This Course
              </PopButton>
            </ComicPanel>
          </div>
        </div>
      </section>

      {/* Thank You Wall */}
      <section className="py-16 bg-foreground text-background">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-display text-pop-yellow text-center mb-4">
            Thank You Wall
          </h2>
          <p className="text-center opacity-80 max-w-xl mx-auto mb-12">
            Gratitude to everyone who has contributed to the journey. 💛
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {thankYouWall.map((contributor, index) => (
              <div
                key={index}
                className="p-4 border-2 border-background text-center"
              >
                <div className="text-2xl font-display text-pop-cyan mb-2">
                  ${contributor.amount}
                </div>
                <div className="font-bold">{contributor.name}</div>
                <p className="text-sm opacity-80 mt-1">"{contributor.message}"</p>
              </div>
            ))}
          </div>

          <p className="text-center text-sm opacity-60 mt-8">
            Want to appear here? Opt-in when you contribute!
          </p>
        </div>
      </section>

      {/* Why Support */}
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
    </Layout>
  );
};

export default Support;
