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
import SiteContent from "./pages/admin/SiteContent";
import HomeContent from "./pages/admin/HomeContent";
import AboutContent from "./pages/admin/AboutContent";
import FuturePlansManager from "./pages/admin/FuturePlansManager";
import SuppliesManager from "./pages/admin/SuppliesManager";
import ArticlesManager from "./pages/admin/ArticlesManager";
import UpdatesManager from "./pages/admin/UpdatesManager";
import UpdateEditor from "./pages/admin/UpdateEditor";
import ArticleEditor from "./pages/admin/ArticleEditor";
import Dashboard from "./pages/admin/Dashboard";
import Analytics from "./pages/admin/Analytics";
import TimeTracker from "./pages/admin/TimeTracker";
import SalesDataManager from "./pages/admin/SalesDataManager";
import FundingCampaignsManager from "./pages/admin/FundingCampaignsManager";
import ClientWorkManager from "./pages/admin/ClientWorkManager";
import ClientProjectEditor from "./pages/admin/ClientProjectEditor";
import FavoritesManager from "./pages/admin/FavoritesManager";
import FavoriteEditor from "./pages/admin/FavoriteEditor";
import InspirationsManager from "./pages/admin/InspirationsManager";
import InspirationEditor from "./pages/admin/InspirationEditor";
import LifePeriodsManager from "./pages/admin/LifePeriodsManager";
import LifePeriodEditor from "./pages/admin/LifePeriodEditor";

// Public pages
import Supplies from "./pages/Supplies";
import ClientWork from "./pages/ClientWork";
import ClientProjectDetail from "./pages/ClientProjectDetail";
import Favorites from "./pages/Favorites";
import FavoriteDetail from "./pages/FavoriteDetail";
import Inspirations from "./pages/Inspirations";
import InspirationDetail from "./pages/InspirationDetail";
import LifeTimeline from "./pages/LifeTimeline";
import LifePeriodDetail from "./pages/LifePeriodDetail";
import Profile from "./pages/Profile";
import Experiments from "./pages/Experiments";
import ExperimentDetail from "./pages/ExperimentDetail";
import Store from "./pages/Store";
import StoreProductDetail from "./pages/StoreProductDetail";

// Additional Admin pages
import ExperimentsManager from "./pages/admin/ExperimentsManager";
import ExperimentEditor from "./pages/admin/ExperimentEditor";
import ProductsManager from "./pages/admin/ProductsManager";
import ProductEditor from "./pages/admin/ProductEditor";
import ContributionsManager from "./pages/admin/ContributionsManager";
import ContentReviewManager from "./pages/admin/ContentReviewManager";
import LeadDetail from "./pages/admin/LeadDetail";
import ExperiencesManager from "./pages/admin/ExperiencesManager";
import ExperienceEditorPage from "./pages/admin/ExperienceEditor";
import CertificationsManager from "./pages/admin/CertificationsManager";
import CertificationEditor from "./pages/admin/CertificationEditor";
import ContentLibrary from "./pages/admin/ContentLibrary";
import QuickCapture from "./pages/admin/QuickCapture";
import MediaLibrary from "./pages/admin/MediaLibrary";

// Additional Public pages
import ExperiencesPage from "./pages/Experiences";
import ExperienceDetailPage from "./pages/ExperienceDetail";
import CertificationsPage from "./pages/Certifications";
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
              <Route path="/supplies" element={<Supplies />} />
              <Route path="/client-work" element={<ClientWork />} />
              <Route path="/client-work/:slug" element={<ClientProjectDetail />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/favorites/:id" element={<FavoriteDetail />} />
              <Route path="/inspirations" element={<Inspirations />} />
              <Route path="/inspirations/:id" element={<InspirationDetail />} />
              <Route path="/timeline" element={<LifeTimeline />} />
              <Route path="/timeline/:id" element={<LifePeriodDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/experiments" element={<Experiments />} />
              <Route path="/experiments/:slug" element={<ExperimentDetail />} />
              <Route path="/store" element={<Store />} />
              <Route path="/store/:slug" element={<StoreProductDetail />} />
              <Route path="/experiences" element={<ExperiencesPage />} />
              <Route path="/experiences/:slug" element={<ExperienceDetailPage />} />
              <Route path="/certifications" element={<CertificationsPage />} />
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
              <Route path="/admin/content/site" element={<SiteContent />} />
              <Route path="/admin/content/home" element={<HomeContent />} />
              <Route path="/admin/content/about" element={<AboutContent />} />
              <Route path="/admin/future-plans" element={<FuturePlansManager />} />
              <Route path="/admin/supplies" element={<SuppliesManager />} />
              <Route path="/admin/articles" element={<ArticlesManager />} />
              <Route path="/admin/updates" element={<UpdatesManager />} />
              <Route path="/admin/time-tracker" element={<TimeTracker />} />
              <Route path="/admin/sales" element={<SalesDataManager />} />
              <Route path="/admin/funding-campaigns" element={<FundingCampaignsManager />} />
              <Route path="/admin/client-work" element={<ClientWorkManager />} />
              <Route path="/admin/client-work/new" element={<ClientProjectEditor />} />
              <Route path="/admin/client-work/:id/edit" element={<ClientProjectEditor />} />
              <Route path="/admin/favorites" element={<FavoritesManager />} />
              <Route path="/admin/favorites/new" element={<FavoriteEditor />} />
              <Route path="/admin/favorites/:id/edit" element={<FavoriteEditor />} />
              <Route path="/admin/inspirations" element={<InspirationsManager />} />
              <Route path="/admin/inspirations/new" element={<InspirationEditor />} />
              <Route path="/admin/inspirations/:id/edit" element={<InspirationEditor />} />
              <Route path="/admin/life-periods" element={<LifePeriodsManager />} />
              <Route path="/admin/life-periods/new" element={<LifePeriodEditor />} />
              <Route path="/admin/life-periods/:id/edit" element={<LifePeriodEditor />} />
              <Route path="/admin/experiments" element={<ExperimentsManager />} />
              <Route path="/admin/experiments/new" element={<ExperimentEditor />} />
              <Route path="/admin/experiments/:id/edit" element={<ExperimentEditor />} />
              <Route path="/admin/products" element={<ProductsManager />} />
              <Route path="/admin/products/new" element={<ProductEditor />} />
              <Route path="/admin/products/:id/edit" element={<ProductEditor />} />
              <Route path="/admin/contributions" element={<ContributionsManager />} />
              <Route path="/admin/content-review" element={<ContentReviewManager />} />
              <Route path="/admin/leads/:id" element={<LeadDetail />} />
              <Route path="/admin/experiences" element={<ExperiencesManager />} />
              <Route path="/admin/experiences/new" element={<ExperienceEditorPage />} />
              <Route path="/admin/experiences/:id/edit" element={<ExperienceEditorPage />} />
              <Route path="/admin/certifications" element={<CertificationsManager />} />
              <Route path="/admin/certifications/new" element={<CertificationEditor />} />
              <Route path="/admin/certifications/:id/edit" element={<CertificationEditor />} />
              <Route path="/admin/content-library" element={<ContentLibrary />} />
              <Route path="/admin/quick-capture" element={<QuickCapture />} />
              <Route path="/admin/media-library" element={<MediaLibrary />} />
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
