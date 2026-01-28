import { Layout } from "@/components/layout/Layout";
import { ComicPanel, PopButton, SpeechBubble, HalftoneImage } from "@/components/pop-art";
import { Mail, ExternalLink, Heart, Download } from "lucide-react";
import { Link } from "react-router-dom";

import zacPortrait from "@/assets/artwork/zac-portrait.png";

const About = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="py-20 benday-dots">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="caption-box inline-block mb-4">About</div>
              <h1 className="text-5xl md:text-7xl font-display gradient-text mb-6">
                The Human Behind the Work
              </h1>
              <p className="text-xl font-sans text-muted-foreground">
                Artist. Developer. Writer. Type 1 Diabetic. Exploring what it means
                to be human through every medium I can get my hands on.
              </p>
            </div>
            <div className="flex justify-center">
              <HalftoneImage
                src={zacPortrait}
                alt="LeCompte portrait"
                frameColor="magenta"
                className="max-w-sm animate-fade-in"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 screen-print">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-display mb-8">My Story</h2>

            <div className="space-y-6 text-lg font-sans leading-relaxed">
              <p>
                The human experience is everything to me. From the moment I was
                diagnosed with Type 1 Diabetes, I understood that life is about
                transformation — about taking the challenges we're given and
                finding meaning, beauty, and purpose within them.
              </p>

              <p>
                I create across disciplines because no single medium can capture
                everything I want to explore. Through <strong>visual art</strong>,
                I examine identity, culture, and emotion. Through{" "}
                <strong>technology</strong>, I build tools that empower people to
                connect, learn, and change. Through <strong>writing</strong>, I
                dive deep into philosophy, narrative, and the patterns that shape
                our world.
              </p>

              <p>
                My work is informed by my passions: the T1D community, the power
                of art to influence culture, philosophical inquiry, narrative
                storytelling, technology for social change, historical patterns,
                and the profound journeys of personal transformation we all
                undergo.
              </p>

              <SpeechBubble className="my-8">
                <p className="text-xl font-display">
                  "I build tools that allow for change and different ways of
                  innovative operation. I'm passionate about complex,
                  interconnected ecosystems that reflect society and what makes
                  us human."
                </p>
              </SpeechBubble>

              <p>
                Whether it's <strong>Notardex</strong> helping people organize
                their thoughts, <strong>Solutiodex</strong> connecting communities
                to solutions, or <strong>Zodaci</strong> exploring cosmic
                connections — every project is an exploration of the human
                experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Areas of Interest */}
      <section className="py-16 bg-foreground text-background">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-display text-pop-yellow text-center mb-12">
            What Drives Me
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                title: "Type 1 Diabetes",
                description: "Living with T1D has shaped my understanding of resilience and the importance of community support systems.",
              },
              {
                title: "Art & Cultural Influence",
                description: "Exploring how visual art shapes society, reflects our values, and drives cultural conversation.",
              },
              {
                title: "Philosophy & Metaphysics",
                description: "Deep inquiry into the nature of reality, consciousness, and what it means to exist.",
              },
              {
                title: "Narrative Storytelling",
                description: "The power of stories to transform perspectives, build empathy, and inspire change.",
              },
              {
                title: "Technology for Change",
                description: "Building digital tools that empower individuals and communities to solve real problems.",
              },
              {
                title: "Personal Transformation",
                description: "Documenting and celebrating the powerful journeys of overcoming and growth.",
              },
            ].map((interest) => (
              <div
                key={interest.title}
                className="p-6 border-2 border-background"
              >
                <h3 className="text-xl font-display text-pop-cyan mb-2">
                  {interest.title}
                </h3>
                <p className="text-sm opacity-80">{interest.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Clients */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-display text-center mb-4">
              Work With Me
            </h2>
            <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
              I'm available for collaborations, commissioned work, and consulting
              in web development, UX design, content creation, and visual art.
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              <ComicPanel className="p-6">
                <h3 className="text-2xl font-display mb-4">Services</h3>
                <ul className="space-y-3">
                  {[
                    "Web Development & UX Design",
                    "Content Writing & Journalism",
                    "Custom Illustration & Portraits",
                    "UX Research & Analysis",
                    "Brand Identity Development",
                  ].map((service) => (
                    <li key={service} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary" />
                      <span className="font-sans">{service}</span>
                    </li>
                  ))}
                </ul>
              </ComicPanel>

              <ComicPanel className="p-6 bg-pop-cyan">
                <h3 className="text-2xl font-display mb-4">Get in Touch</h3>
                <p className="font-sans mb-6">
                  Have a project in mind? Let's create something meaningful
                  together.
                </p>
                <div className="space-y-3">
                  <a
                    href="mailto:hello@lecompte.art"
                    className="flex items-center gap-2 font-bold hover:underline"
                  >
                    <Mail className="w-5 h-5" /> hello@lecompte.art
                  </a>
                </div>
              </ComicPanel>
            </div>

            {/* Media Kit */}
            <div className="mt-12 text-center">
              <p className="text-muted-foreground mb-4">
                Need a professional overview?
              </p>
              <PopButton variant="primary">
                <Download className="w-4 h-4 mr-2" /> Download Media Kit (Coming
                Soon)
              </PopButton>
            </div>
          </div>
        </div>
      </section>

      {/* Live Projects */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-display text-center mb-12">
            My Live Projects
          </h2>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                title: "Notardex",
                url: "https://notardex.com",
                description: "Virtual notebook platform",
              },
              {
                title: "Solutiodex",
                url: "https://solutiodex.com",
                description: "Community-driven solutions",
              },
              {
                title: "Zodaci",
                url: "https://zodaci.com",
                description: "Birth charts & astrology",
              },
            ].map((project) => (
              <a
                key={project.title}
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ComicPanel className="p-6 h-full">
                  <h3 className="text-xl font-display mb-2">{project.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {project.description}
                  </p>
                  <span className="pop-link text-sm font-bold inline-flex items-center gap-1">
                    Visit <ExternalLink className="w-4 h-4" />
                  </span>
                </ComicPanel>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-pop-magenta">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-display text-background mb-6">
            Support the Journey
          </h2>
          <p className="text-lg text-background/80 max-w-xl mx-auto mb-8">
            Every contribution helps fund new projects, learning, and the
            continuous exploration of what makes us human.
          </p>
          <Link to="/support">
            <PopButton variant="accent" size="lg">
              <Heart className="w-5 h-5 mr-2" /> Support My Work
            </PopButton>
          </Link>
        </div>
      </section>
    </Layout>
  );
};

export default About;
