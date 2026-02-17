import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PopButton } from "@/components/pop-art";
import { Heart, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface FundingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  targetId?: string;
  contributionType: "development" | "research" | "supplies" | "general";
  onSuccess?: () => void;
}

const presetAmounts = [5, 10, 25, 50, 100];

export const FundingModal = ({
  open,
  onOpenChange,
  title,
  description,
  targetId,
  contributionType,
  onSuccess,
}: FundingModalProps) => {
  const { user } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(25);
  const [customAmount, setCustomAmount] = useState("");
  const [message, setMessage] = useState("");
  const [showPublicly, setShowPublicly] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const parsedCustom = customAmount ? parseFloat(customAmount) : 0;
  const amount = selectedAmount || (Number.isFinite(parsedCustom) ? parsedCustom : 0);

  const handleSubmit = async () => {
    if (!amount || amount <= 0 || amount > 10000) {
      toast.error(amount > 10000 ? "Maximum contribution is $10,000" : "Please select a valid amount");
      return;
    }

    setSubmitting(true);
    try {
      // Save contribution to database
      const { error } = await supabase.from("contributions").insert({
        amount,
        contribution_type: contributionType,
        target_id: targetId || null,
        message: message || null,
        show_publicly: showPublicly,
        user_id: user?.id || null,
      });

      if (error) throw error;

      toast.success("Thank you for your contribution! 💛");
      onOpenChange(false);
      onSuccess?.();
      
      // Reset form
      setSelectedAmount(25);
      setCustomAmount("");
      setMessage("");
      setShowPublicly(false);
    } catch (error) {
      console.error("Contribution error:", error);
      toast.error("Failed to process contribution. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-4 border-foreground">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display">{title}</DialogTitle>
          {description && (
            <p className="text-sm text-muted-foreground mt-2">{description}</p>
          )}
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Amount Selection */}
          <div>
            <Label className="text-sm font-bold">Select Amount</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {presetAmounts.map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    setSelectedAmount(preset);
                    setCustomAmount("");
                  }}
                  className={`py-3 font-bold border-2 border-foreground transition-all ${
                    selectedAmount === preset
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted"
                  }`}
                >
                  ${preset}
                </button>
              ))}
              <input
                type="number"
                placeholder="Other"
                value={customAmount}
                min="1"
                max="10000"
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedAmount(null);
                }}
                className="py-3 px-2 font-bold border-2 border-foreground bg-background text-center"
              />
            </div>
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a message of support..."
              rows={2}
              maxLength={500}
              className="mt-1"
            />
          </div>

          {/* Public Display */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="showPublicly"
              checked={showPublicly}
              onChange={(e) => setShowPublicly(e.target.checked)}
              className="w-5 h-5 border-2 border-foreground"
            />
            <Label htmlFor="showPublicly" className="text-sm cursor-pointer">
              Show my contribution on the Thank You wall
            </Label>
          </div>

          {/* Submit */}
          <PopButton
            variant="primary"
            className="w-full justify-center"
            onClick={handleSubmit}
            disabled={amount <= 0 || submitting}
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Heart className="w-4 h-4 mr-2" />
            )}
            Contribute ${amount || 0}
          </PopButton>

          <p className="text-xs text-center text-muted-foreground">
            🔒 Secure payments powered by Stripe (coming soon)
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
