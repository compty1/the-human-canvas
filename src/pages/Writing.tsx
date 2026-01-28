import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, LikeButton } from "@/components/pop-art";
import { Clock, Tag } from "lucide-react";

type WritingCategory = "philosophy" | "narrative" | "cultural" | "ux_review" | "research";

interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: WritingCategory;
  readingTime: number;
  tags: string[];
  likes: number;
  date: string;
}

const articlesData: Article[] = [
  {
    id: "1",
    title: "The Metaphysics of Connection in a Digital Age",
    excerpt: "Exploring how technology both bridges and fragments our fundamental human need for authentic connection. What does it mean to be 'present' when presence itself becomes virtual?",
    category: "philosophy",
    readingTime: 12,
    tags: ["metaphysics", "technology", "connection"],
    likes: 34,
    date: "2024-01-15",
  },
  {
    id: "2",
    title: "Journey Through Diagnosis: A T1D Story",
    excerpt: "A personal narrative about the day everything changed — and how transformation emerges from the moments we least expect. Living with Type 1 Diabetes taught me more about life than any book ever could.",
    category: "narrative",
    readingTime: 8,
    tags: ["diabetes", "personal", "transformation"],
    likes: 67,
    date: "2024-01-10",
  },
  {
    id: "3",
    title: "Pop Art's Lasting Influence on Digital Design",
    excerpt: "From Warhol to web design — tracing how the bold, democratic aesthetics of pop art continue to shape how we create and consume digital experiences today.",
    category: "cultural",
    readingTime: 10,
    tags: ["art", "design", "culture"],
    likes: 45,
    date: "2024-01-05",
  },
  {
    id: "4",
    title: "UX Case Study: Why Notion Wins at Flexibility",
    excerpt: "A deep dive into Notion's user experience philosophy. How does a tool that does everything manage to feel simple? Breaking down the design decisions that matter.",
    category: "ux_review",
    readingTime: 15,
    tags: ["ux", "notion", "productivity"],
    likes: 28,
    date: "2023-12-28",
  },
  {
    id: "5",
    title: "Historical Patterns in Social Movements",
    excerpt: "Comparing contemporary activism with historical movements reveals surprising patterns. What can today's change-makers learn from those who came before?",
    category: "research",
    readingTime: 18,
    tags: ["history", "activism", "society"],
    likes: 41,
    date: "2023-12-20",
  },
  {
    id: "6",
    title: "The Art of Transformation Stories",
    excerpt: "Why do we love stories about change? Examining the narrative structure of transformation tales and what they reveal about our deepest hopes.",
    category: "narrative",
    readingTime: 7,
    tags: ["storytelling", "transformation", "narrative"],
    likes: 52,
    date: "2023-12-15",
  },
];

const categories = [
  { id: "all", label: "All Writing" },
  { id: "philosophy", label: "Philosophy & Metaphysics" },
  { id: "narrative", label: "Narrative Stories" },
  { id: "cultural", label: "Cultural Commentary" },
  { id: "ux_review", label: "UX Reviews" },
  { id: "research", label: "Research & Informative" },
];

const categoryColors: Record<WritingCategory, string> = {
  philosophy: "bg-pop-magenta",
  narrative: "bg-pop-cyan",
  cultural: "bg-pop-yellow",
  ux_review: "bg-pop-orange",
  research: "bg-secondary",
};

const Writing = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());

  const filteredArticles =
    selectedCategory === "all"
      ? articlesData
      : articlesData.filter((a) => a.category === selectedCategory);

  const toggleLike = (id: string) => {
    setLikedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="py-20 benday-dots">
        <div className="container mx-auto px-4">
          <div className="caption-box inline-block mb-4">Content & Writing</div>
          <h1 className="text-5xl md:text-7xl font-display gradient-text mb-6">
            Writing & Content
          </h1>
          <p className="text-xl font-sans max-w-2xl text-muted-foreground">
            Essays, stories, and explorations across philosophy, culture, UX, and
            the human experience. Words that make you think.
          </p>
        </div>
      </section>

      {/* Filter */}
      <section className="py-8 border-y-4 border-foreground bg-background sticky top-16 z-40">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 font-bold uppercase text-sm tracking-wide border-2 border-foreground transition-all ${
                  selectedCategory === category.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-16 screen-print">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            {filteredArticles.map((article, index) => (
              <ComicPanel
                key={article.id}
                className={`p-6 animate-fade-in stagger-${(index % 5) + 1}`}
              >
                {/* Category Badge */}
                <div
                  className={`inline-block px-3 py-1 text-xs font-bold uppercase tracking-wide border-2 border-foreground mb-4 ${
                    categoryColors[article.category]
                  }`}
                >
                  {article.category.replace("_", " ")}
                </div>

                <h3 className="text-2xl font-display mb-3">{article.title}</h3>
                <p className="text-sm font-sans text-muted-foreground mb-4">
                  {article.excerpt}
                </p>

                {/* Meta */}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" /> {article.readingTime} min read
                  </span>
                  <span>{new Date(article.date).toLocaleDateString()}</span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {article.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-xs font-bold bg-muted border border-muted-foreground inline-flex items-center gap-1"
                    >
                      <Tag className="w-3 h-3" /> {tag}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t-2 border-muted">
                  <LikeButton
                    count={article.likes + (likedItems.has(article.id) ? 1 : 0)}
                    liked={likedItems.has(article.id)}
                    onLike={() => toggleLike(article.id)}
                  />
                  <button className="pop-link text-sm font-bold">
                    Read More →
                  </button>
                </div>
              </ComicPanel>
            ))}
          </div>
        </div>
      </section>

      {/* Placeholder for full article */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-display mb-4">More Content Coming Soon</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Full articles with complete content will be added as they're written.
            Check back regularly for new essays and stories.
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default Writing;
