 import { useState } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { Input } from "@/components/ui/input";
 import { PopButton } from "@/components/pop-art";
 import { Mail, Loader2, CheckCircle } from "lucide-react";
 import { toast } from "sonner";
 
 interface SubscribeFormProps {
   source?: string;
   compact?: boolean;
 }
 
 export const SubscribeForm = ({ source = "website", compact = false }: SubscribeFormProps) => {
   const [email, setEmail] = useState("");
   const [name, setName] = useState("");
   const [submitting, setSubmitting] = useState(false);
   const [success, setSuccess] = useState(false);
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!email) return;
 
     setSubmitting(true);
     try {
       const { error } = await supabase
         .from("email_subscribers")
         .insert({ email, name: name || null, source });
 
       if (error) {
         if (error.code === "23505") {
           toast.info("You're already subscribed!");
         } else {
           throw error;
         }
       } else {
         setSuccess(true);
         toast.success("Thanks for subscribing!");
       }
     } catch (error) {
       console.error("Subscribe error:", error);
       toast.error("Failed to subscribe. Please try again.");
     } finally {
       setSubmitting(false);
     }
   };
 
   if (success) {
     return (
       <div className="flex items-center gap-2 text-green-500">
         <CheckCircle className="w-5 h-5" />
         <span>You're subscribed!</span>
       </div>
     );
   }
 
   if (compact) {
     return (
       <form onSubmit={handleSubmit} className="flex gap-2">
         <Input
           type="email"
           value={email}
           onChange={(e) => setEmail(e.target.value)}
           placeholder="Your email"
           required
           className="flex-1"
         />
         <PopButton type="submit" disabled={submitting} size="sm">
           {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
         </PopButton>
       </form>
     );
   }
 
   return (
     <form onSubmit={handleSubmit} className="space-y-3">
       <div className="flex items-center gap-2 mb-2">
         <Mail className="w-5 h-5" />
         <span className="font-bold">Get Updates</span>
       </div>
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name (optional)"
          maxLength={100}
        />
       <Input
         type="email"
         value={email}
         onChange={(e) => setEmail(e.target.value)}
         placeholder="Your email"
         required
       />
       <PopButton type="submit" disabled={submitting} className="w-full">
         {submitting ? (
           <>
             <Loader2 className="w-4 h-4 mr-2 animate-spin" />
             Subscribing...
           </>
         ) : (
           "Subscribe to Updates"
         )}
       </PopButton>
       <p className="text-xs text-muted-foreground">
         Get notified when new content is published. No spam.
       </p>
     </form>
   );
 };