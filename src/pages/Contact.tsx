import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Mail, MapPin, Loader2, CheckCircle } from "lucide-react";

const Contact = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("contact_inquiries")
        .insert({
          name: form.name,
          email: form.email,
          subject: form.subject || null,
          message: form.message,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Message sent successfully!");
    },
    onError: (error) => {
      console.error("Contact form error:", error);
      toast.error("Failed to send message. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    submitMutation.mutate();
  };

  if (submitted) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 max-w-2xl">
          <ComicPanel className="p-12 text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-6 text-green-500" />
            <h1 className="text-4xl font-display mb-4">Message Sent!</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Thank you for reaching out. I'll get back to you as soon as possible.
            </p>
            <PopButton onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }); }}>
              Send Another Message
            </PopButton>
          </ComicPanel>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-display mb-4">Get In Touch</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Have a project in mind, want to collaborate, or just say hello? 
              I'd love to hear from you.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="space-y-6">
              <ComicPanel className="p-6">
                <Mail className="w-8 h-8 mb-3 text-primary" />
                <h3 className="font-bold text-lg mb-1">Email</h3>
                <p className="text-muted-foreground text-sm">
                  Drop me an email anytime
                </p>
              </ComicPanel>

              <ComicPanel className="p-6">
                <MapPin className="w-8 h-8 mb-3 text-primary" />
                <h3 className="font-bold text-lg mb-1">Location</h3>
                <p className="text-muted-foreground text-sm">
                  Los Angeles, California
                </p>
              </ComicPanel>

              <ComicPanel className="p-6 bg-primary/5">
                <h3 className="font-bold text-lg mb-2">Quick Response</h3>
                <p className="text-sm text-muted-foreground">
                  I typically respond within 24-48 hours. For urgent inquiries, 
                  please mention it in your subject line.
                </p>
              </ComicPanel>
            </div>

            {/* Contact Form */}
            <ComicPanel className="md:col-span-2 p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Your name"
                      required
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="your@email.com"
                      required
                      maxLength={255}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={form.subject}
                    onChange={(e) => setForm(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="What's this about?"
                    maxLength={200}
                  />
                </div>

                <div>
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    value={form.message}
                    onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Tell me about your project, idea, or just say hello..."
                    rows={6}
                    required
                    maxLength={5000}
                  />
                </div>

                <PopButton 
                  type="submit" 
                  disabled={submitMutation.isPending}
                  className="w-full justify-center"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </>
                  )}
                </PopButton>
              </form>
            </ComicPanel>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;
