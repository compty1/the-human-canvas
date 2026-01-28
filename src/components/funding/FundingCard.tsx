import { useState } from "react";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { Heart, Code, Beaker, Package } from "lucide-react";
import { FundingModal } from "./FundingModal";

interface FundingCardProps {
  id: string;
  type: "development" | "research" | "supplies";
  title: string;
  description: string;
  targetAmount: number;
  raisedAmount: number;
  projectTitle?: string;
}

const typeConfig = {
  development: {
    icon: Code,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    label: "Development",
  },
  research: {
    icon: Beaker,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    label: "Research",
  },
  supplies: {
    icon: Package,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    label: "Supplies",
  },
};

export const FundingCard = ({
  id,
  type,
  title,
  description,
  targetAmount,
  raisedAmount,
  projectTitle,
}: FundingCardProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const config = typeConfig[type];
  const Icon = config.icon;
  const progress = targetAmount > 0 ? (raisedAmount / targetAmount) * 100 : 0;

  return (
    <>
      <ComicPanel className="p-6">
        <div className="flex items-start gap-4">
          <div className={`p-3 ${config.bgColor} ${config.borderColor} border-2 rounded`}>
            <Icon className={`w-6 h-6 ${config.color}`} />
          </div>
          <div className="flex-grow">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-bold uppercase ${config.color}`}>
                {config.label}
              </span>
              {projectTitle && (
                <span className="text-xs text-muted-foreground">
                  • {projectTitle}
                </span>
              )}
            </div>
            <h3 className="text-lg font-display mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{description}</p>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-bold">${raisedAmount.toLocaleString()}</span>
                <span className="text-muted-foreground">
                  of ${targetAmount.toLocaleString()}
                </span>
              </div>
              <div className="h-3 bg-muted border-2 border-foreground overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(progress)}% funded
              </p>
            </div>

            <PopButton
              variant="primary"
              size="sm"
              onClick={() => setModalOpen(true)}
            >
              <Heart className="w-4 h-4 mr-1" />
              Fund This
            </PopButton>
          </div>
        </div>
      </ComicPanel>

      <FundingModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={`Fund: ${title}`}
        description={description}
        targetId={id}
        contributionType={type}
      />
    </>
  );
};
