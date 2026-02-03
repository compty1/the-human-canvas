import { Copy } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DuplicateButtonProps {
  id: string;
  type: "project" | "article" | "update" | "experiment" | "product" | "product-review" | "favorite" | "inspiration" | "experience" | "certification" | "client-project" | "life-period";
  className?: string;
}

const TYPE_ROUTES: Record<string, string> = {
  project: "/admin/projects/new",
  article: "/admin/articles/new",
  update: "/admin/updates/new",
  experiment: "/admin/experiments/new",
  product: "/admin/products/new",
  "product-review": "/admin/product-reviews/new",
  favorite: "/admin/favorites/new",
  inspiration: "/admin/inspirations/new",
  experience: "/admin/experiences/new",
  certification: "/admin/certifications/new",
  "client-project": "/admin/client-work/new",
  "life-period": "/admin/life-periods/new",
};

export const DuplicateButton = ({ id, type, className = "" }: DuplicateButtonProps) => {
  const navigate = useNavigate();

  const handleDuplicate = () => {
    const route = TYPE_ROUTES[type];
    if (route) {
      navigate(`${route}?clone=${id}`);
    }
  };

  return (
    <button
      onClick={handleDuplicate}
      className={`p-2 hover:bg-muted rounded ${className}`}
      title="Duplicate"
    >
      <Copy className="w-4 h-4" />
    </button>
  );
};
