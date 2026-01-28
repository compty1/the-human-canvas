import { Layout } from "@/components/layout/Layout";
import { ComicPanel } from "@/components/pop-art";
import { Progress } from "@/components/ui/progress";
import {
  Code,
  Palette,
  PenTool,
  Search,
  Globe,
  Database,
  Smartphone,
  BarChart,
} from "lucide-react";

interface Skill {
  name: string;
  proficiency: number;
  icon: React.ElementType;
}

interface SkillCategory {
  title: string;
  color: string;
  skills: Skill[];
}

const skillCategories: SkillCategory[] = [
  {
    title: "Web Development & UX Design",
    color: "bg-pop-cyan",
    skills: [
      { name: "React / TypeScript", proficiency: 90, icon: Code },
      { name: "HTML / CSS / Tailwind", proficiency: 95, icon: Globe },
      { name: "UX Design & Research", proficiency: 85, icon: Search },
      { name: "Database Design", proficiency: 80, icon: Database },
      { name: "Mobile Development", proficiency: 70, icon: Smartphone },
    ],
  },
  {
    title: "Content Creation & Journalism",
    color: "bg-pop-magenta",
    skills: [
      { name: "Essay & Long-form Writing", proficiency: 90, icon: PenTool },
      { name: "Cultural Commentary", proficiency: 85, icon: Globe },
      { name: "Research & Investigation", proficiency: 88, icon: Search },
      { name: "Storytelling", proficiency: 92, icon: PenTool },
    ],
  },
  {
    title: "Visual Art & Illustration",
    color: "bg-pop-yellow",
    skills: [
      { name: "Digital Illustration", proficiency: 88, icon: Palette },
      { name: "Portrait Art", proficiency: 85, icon: Palette },
      { name: "Pop Art Style", proficiency: 92, icon: Palette },
      { name: "Mixed Media", proficiency: 78, icon: Palette },
    ],
  },
  {
    title: "Research & Analysis",
    color: "bg-secondary",
    skills: [
      { name: "Data Analysis", proficiency: 75, icon: BarChart },
      { name: "Academic Research", proficiency: 82, icon: Search },
      { name: "Competitive Analysis", proficiency: 85, icon: BarChart },
      { name: "User Research", proficiency: 80, icon: Search },
    ],
  },
];

const Skills = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="py-20 benday-dots">
        <div className="container mx-auto px-4">
          <div className="caption-box inline-block mb-4">Expertise</div>
          <h1 className="text-5xl md:text-7xl font-display gradient-text mb-6">
            Skills & Expertise
          </h1>
          <p className="text-xl font-sans max-w-2xl text-muted-foreground">
            A multidisciplinary toolkit for creating, building, and analyzing.
            From code to canvas, research to writing.
          </p>
        </div>
      </section>

      {/* Skills Grid */}
      <section className="py-16 screen-print">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            {skillCategories.map((category, catIndex) => (
              <ComicPanel
                key={category.title}
                className={`p-6 animate-fade-in stagger-${catIndex + 1}`}
              >
                <div
                  className={`inline-block px-3 py-1 text-xs font-bold uppercase tracking-wide border-2 border-foreground mb-4 ${category.color}`}
                >
                  {category.title}
                </div>

                <div className="space-y-6">
                  {category.skills.map((skill) => (
                    <div key={skill.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <skill.icon className="w-5 h-5" />
                          <span className="font-bold">{skill.name}</span>
                        </div>
                        <span className="text-sm font-bold text-muted-foreground">
                          {skill.proficiency}%
                        </span>
                      </div>
                      <div className="h-3 bg-muted border-2 border-foreground overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-1000"
                          style={{ width: `${skill.proficiency}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </ComicPanel>
            ))}
          </div>
        </div>
      </section>

      {/* Areas of Interest */}
      <section className="py-16 bg-foreground text-background">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-display text-pop-yellow text-center mb-12">
            Areas of Interest & Passion
          </h2>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              "Type 1 Diabetes",
              "Art & Culture",
              "Philosophy",
              "Metaphysics",
              "Narrative Storytelling",
              "Technology",
              "Social Change",
              "Historical Patterns",
              "UX & Products",
              "Personal Transformation",
              "Community Building",
              "Innovation",
            ].map((interest, index) => (
              <div
                key={interest}
                className={`p-4 border-2 border-background text-center font-bold uppercase tracking-wide transition-all hover:bg-pop-magenta hover:border-pop-magenta animate-fade-in stagger-${(index % 5) + 1}`}
              >
                {interest}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy Statement */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-display mb-8">My Approach</h2>
            <div className="speech-bubble text-left">
              <p className="text-lg font-sans leading-relaxed">
                "I believe in building tools that allow for change and different
                ways of innovative operation that is efficient. I'm passionate
                about complex builds and interconnected ecosystems, creating
                pieces that reflect society and the human experience. Every
                project, whether it's code, art, or words, is an exploration of
                what makes us human."
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Skills;
