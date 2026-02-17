import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { AlertTriangle, Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    document.title = "404 Not Found | LeCompte";
  }, [location.pathname]);

  return (
    <Layout>
      <section className="py-20 min-h-[70vh] flex items-center benday-dots">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto">
            <ComicPanel className="p-8 text-center">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-pop-yellow" />
              <h1 className="text-6xl font-display mb-2">404</h1>
              <p className="text-xl text-muted-foreground mb-8">
                This page doesn't exist — maybe it was a future artifact that hasn't been created yet.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Link to="/">
                  <PopButton variant="primary">
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                  </PopButton>
                </Link>
                <PopButton variant="secondary" onClick={() => window.history.back()}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </PopButton>
              </div>
            </ComicPanel>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default NotFound;
