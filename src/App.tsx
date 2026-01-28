import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { useAnalytics } from "@/hooks/useAnalytics";

import Index from "./pages/Index";
import ArtGallery from "./pages/ArtGallery";
import Projects from "./pages/Projects";
import Writing from "./pages/Writing";
import Updates from "./pages/Updates";
import UpdateDetail from "./pages/UpdateDetail";
import Articles from "./pages/Articles";
import ArticleDetail from "./pages/ArticleDetail";
import Skills from "./pages/Skills";
import FuturePlans from "./pages/FuturePlans";
import Support from "./pages/Support";
import About from "./pages/About";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ProjectDetail from "./pages/ProjectDetail";
import ProductReviews from "./pages/ProductReviews";
import ProductReviewDetail from "./pages/ProductReviewDetail";

// Admin pages
import ProjectsManager from "./pages/admin/ProjectsManager";
import ProjectEditor from "./pages/admin/ProjectEditor";
import ArtworkManager from "./pages/admin/ArtworkManager";
import ArtworkEditor from "./pages/admin/ArtworkEditor";
import SkillsManager from "./pages/admin/SkillsManager";
import LearningGoalsManager from "./pages/admin/LearningGoalsManager";
import LeadFinder from "./pages/admin/LeadFinder";
import AIWriter from "./pages/admin/AIWriter";
import BulkImport from "./pages/admin/BulkImport";
import NotesManager from "./pages/admin/NotesManager";
import ActivityLog from "./pages/admin/ActivityLog";
import Settings from "./pages/admin/Settings";
import ProductReviewsManager from "./pages/admin/ProductReviewsManager";
import ProductReviewEditor from "./pages/admin/ProductReviewEditor";

import UpdateEditor from "./pages/admin/UpdateEditor";
import ArticleEditor from "./pages/admin/ArticleEditor";
import Dashboard from "./pages/admin/Dashboard";
import Analytics from "./pages/admin/Analytics";

const queryClient = new QueryClient();

// Analytics wrapper component
const AnalyticsWrapper = ({ children }: { children: React.ReactNode }) => {
  useAnalytics();
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnalyticsWrapper>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/art" element={<ArtGallery />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/writing" element={<Writing />} />
              <Route path="/updates" element={<Updates />} />
              <Route path="/updates/:slug" element={<UpdateDetail />} />
              <Route path="/articles" element={<Articles />} />
              <Route path="/articles/:slug" element={<ArticleDetail />} />
              <Route path="/skills" element={<Skills />} />
              <Route path="/future" element={<FuturePlans />} />
              <Route path="/support" element={<Support />} />
              <Route path="/about" element={<About />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/projects/:slug" element={<ProjectDetail />} />
              <Route path="/product-reviews" element={<ProductReviews />} />
              <Route path="/product-reviews/:slug" element={<ProductReviewDetail />} />
              
              {/* Admin routes */}
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/analytics" element={<Analytics />} />
              <Route path="/admin/updates/new" element={<UpdateEditor />} />
              <Route path="/admin/updates/:id/edit" element={<UpdateEditor />} />
              <Route path="/admin/articles/new" element={<ArticleEditor />} />
              <Route path="/admin/articles/:id/edit" element={<ArticleEditor />} />
              <Route path="/admin/projects" element={<ProjectsManager />} />
              <Route path="/admin/projects/new" element={<ProjectEditor />} />
              <Route path="/admin/projects/:id/edit" element={<ProjectEditor />} />
              <Route path="/admin/artwork" element={<ArtworkManager />} />
              <Route path="/admin/artwork/new" element={<ArtworkEditor />} />
              <Route path="/admin/artwork/:id/edit" element={<ArtworkEditor />} />
              <Route path="/admin/skills" element={<SkillsManager />} />
              <Route path="/admin/learning-goals" element={<LearningGoalsManager />} />
              <Route path="/admin/leads" element={<LeadFinder />} />
              <Route path="/admin/ai-writer" element={<AIWriter />} />
              <Route path="/admin/import" element={<BulkImport />} />
              <Route path="/admin/notes" element={<NotesManager />} />
              <Route path="/admin/activity" element={<ActivityLog />} />
              <Route path="/admin/settings" element={<Settings />} />
              <Route path="/admin/product-reviews" element={<ProductReviewsManager />} />
              <Route path="/admin/product-reviews/new" element={<ProductReviewEditor />} />
              <Route path="/admin/product-reviews/:id/edit" element={<ProductReviewEditor />} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnalyticsWrapper>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
