import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { useAnalytics } from "@/hooks/useAnalytics";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedAdminRoute } from "@/components/admin/ProtectedAdminRoute";

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
import Contact from "./pages/Contact";

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
import ExperienceEditor from "./pages/admin/ExperienceEditor";
import CertificationsManager from "./pages/admin/CertificationsManager";
import CertificationEditor from "./pages/admin/CertificationEditor";
import ContentLibrary from "./pages/admin/ContentLibrary";
import QuickCapture from "./pages/admin/QuickCapture";
import MediaLibrary from "./pages/admin/MediaLibrary";
import ContentHub from "./pages/admin/ContentHub";

// Additional Public pages
import Experiences from "./pages/Experiences";
import ExperienceDetail from "./pages/ExperienceDetail";
import Certifications from "./pages/Certifications";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Admin route wrapper for convenience
const Admin = ({ children }: { children: React.ReactNode }) => (
  <ProtectedAdminRoute>{children}</ProtectedAdminRoute>
);

// Analytics wrapper component
const AnalyticsWrapper = ({ children }: { children: React.ReactNode }) => {
  useAnalytics();
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <ErrorBoundary>
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
                <Route path="/experiences" element={<Experiences />} />
                <Route path="/experiences/:slug" element={<ExperienceDetail />} />
                <Route path="/certifications" element={<Certifications />} />
                <Route path="/contact" element={<Contact />} />
                {/* Admin routes - all protected */}
                <Route path="/admin" element={<Admin><Dashboard /></Admin>} />
                <Route path="/admin/analytics" element={<Admin><Analytics /></Admin>} />
                <Route path="/admin/updates/new" element={<Admin><UpdateEditor /></Admin>} />
                <Route path="/admin/updates/:id/edit" element={<Admin><UpdateEditor /></Admin>} />
                <Route path="/admin/articles/new" element={<Admin><ArticleEditor /></Admin>} />
                <Route path="/admin/articles/:id/edit" element={<Admin><ArticleEditor /></Admin>} />
                <Route path="/admin/projects" element={<Admin><ProjectsManager /></Admin>} />
                <Route path="/admin/projects/new" element={<Admin><ProjectEditor /></Admin>} />
                <Route path="/admin/projects/:id/edit" element={<Admin><ProjectEditor /></Admin>} />
                <Route path="/admin/artwork" element={<Admin><ArtworkManager /></Admin>} />
                <Route path="/admin/artwork/new" element={<Admin><ArtworkEditor /></Admin>} />
                <Route path="/admin/artwork/:id/edit" element={<Admin><ArtworkEditor /></Admin>} />
                <Route path="/admin/skills" element={<Admin><SkillsManager /></Admin>} />
                <Route path="/admin/learning-goals" element={<Admin><LearningGoalsManager /></Admin>} />
                <Route path="/admin/leads" element={<Admin><LeadFinder /></Admin>} />
                <Route path="/admin/ai-writer" element={<Admin><AIWriter /></Admin>} />
                <Route path="/admin/import" element={<Admin><BulkImport /></Admin>} />
                <Route path="/admin/notes" element={<Admin><NotesManager /></Admin>} />
                <Route path="/admin/activity" element={<Admin><ActivityLog /></Admin>} />
                <Route path="/admin/settings" element={<Admin><Settings /></Admin>} />
                <Route path="/admin/product-reviews" element={<Admin><ProductReviewsManager /></Admin>} />
                <Route path="/admin/product-reviews/new" element={<Admin><ProductReviewEditor /></Admin>} />
                <Route path="/admin/product-reviews/:id/edit" element={<Admin><ProductReviewEditor /></Admin>} />
                <Route path="/admin/content/site" element={<Admin><SiteContent /></Admin>} />
                <Route path="/admin/content/home" element={<Admin><HomeContent /></Admin>} />
                <Route path="/admin/content/about" element={<Admin><AboutContent /></Admin>} />
                <Route path="/admin/future-plans" element={<Admin><FuturePlansManager /></Admin>} />
                <Route path="/admin/supplies" element={<Admin><SuppliesManager /></Admin>} />
                <Route path="/admin/articles" element={<Admin><ArticlesManager /></Admin>} />
                <Route path="/admin/updates" element={<Admin><UpdatesManager /></Admin>} />
                <Route path="/admin/time-tracker" element={<Admin><TimeTracker /></Admin>} />
                <Route path="/admin/sales" element={<Admin><SalesDataManager /></Admin>} />
                <Route path="/admin/funding-campaigns" element={<Admin><FundingCampaignsManager /></Admin>} />
                <Route path="/admin/client-work" element={<Admin><ClientWorkManager /></Admin>} />
                <Route path="/admin/client-work/new" element={<Admin><ClientProjectEditor /></Admin>} />
                <Route path="/admin/client-work/:id/edit" element={<Admin><ClientProjectEditor /></Admin>} />
                <Route path="/admin/favorites" element={<Admin><FavoritesManager /></Admin>} />
                <Route path="/admin/favorites/new" element={<Admin><FavoriteEditor /></Admin>} />
                <Route path="/admin/favorites/:id/edit" element={<Admin><FavoriteEditor /></Admin>} />
                <Route path="/admin/inspirations" element={<Admin><InspirationsManager /></Admin>} />
                <Route path="/admin/inspirations/new" element={<Admin><InspirationEditor /></Admin>} />
                <Route path="/admin/inspirations/:id/edit" element={<Admin><InspirationEditor /></Admin>} />
                <Route path="/admin/life-periods" element={<Admin><LifePeriodsManager /></Admin>} />
                <Route path="/admin/life-periods/new" element={<Admin><LifePeriodEditor /></Admin>} />
                <Route path="/admin/life-periods/:id/edit" element={<Admin><LifePeriodEditor /></Admin>} />
                <Route path="/admin/experiments" element={<Admin><ExperimentsManager /></Admin>} />
                <Route path="/admin/experiments/new" element={<Admin><ExperimentEditor /></Admin>} />
                <Route path="/admin/experiments/:id/edit" element={<Admin><ExperimentEditor /></Admin>} />
                <Route path="/admin/products" element={<Admin><ProductsManager /></Admin>} />
                <Route path="/admin/products/new" element={<Admin><ProductEditor /></Admin>} />
                <Route path="/admin/products/:id/edit" element={<Admin><ProductEditor /></Admin>} />
                <Route path="/admin/contributions" element={<Admin><ContributionsManager /></Admin>} />
                <Route path="/admin/content-review" element={<Admin><ContentReviewManager /></Admin>} />
                <Route path="/admin/leads/:id" element={<Admin><LeadDetail /></Admin>} />
                <Route path="/admin/experiences" element={<Admin><ExperiencesManager /></Admin>} />
                <Route path="/admin/experiences/new" element={<Admin><ExperienceEditor /></Admin>} />
                <Route path="/admin/experiences/:id/edit" element={<Admin><ExperienceEditor /></Admin>} />
                <Route path="/admin/certifications" element={<Admin><CertificationsManager /></Admin>} />
                <Route path="/admin/certifications/new" element={<Admin><CertificationEditor /></Admin>} />
                <Route path="/admin/certifications/:id/edit" element={<Admin><CertificationEditor /></Admin>} />
                <Route path="/admin/content-library" element={<Admin><ContentLibrary /></Admin>} />
                <Route path="/admin/quick-capture" element={<Admin><QuickCapture /></Admin>} />
                <Route path="/admin/media-library" element={<Admin><MediaLibrary /></Admin>} />
                <Route path="/admin/content-hub" element={<Admin><ContentHub /></Admin>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AnalyticsWrapper>
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
