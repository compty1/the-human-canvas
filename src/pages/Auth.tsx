import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, displayName);
        if (error) throw error;
        toast({
          title: "Account created!",
          description: "Check your email to confirm your account.",
        });
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast({
          title: "Welcome back!",
          description: "You've been signed in successfully.",
        });
        navigate("/");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <section className="py-20 min-h-[80vh] flex items-center benday-dots">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <ComicPanel className="p-8">
              <h1 className="text-4xl font-display text-center mb-2">
                {isSignUp ? "Join the Journey" : "Welcome Back"}
              </h1>
              <p className="text-center text-muted-foreground mb-8">
                {isSignUp
                  ? "Create an account to like projects and track your contributions"
                  : "Sign in to your account"}
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="displayName" className="font-bold">
                      Display Name
                    </Label>
                    <Input
                      id="displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      className="border-2 border-foreground"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="font-bold">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="border-2 border-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="font-bold">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="border-2 border-foreground"
                  />
                </div>

                <PopButton
                  type="submit"
                  variant="primary"
                  className="w-full justify-center"
                  disabled={loading}
                >
                  {loading
                    ? "Loading..."
                    : isSignUp
                    ? "Create Account"
                    : "Sign In"}
                </PopButton>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm font-bold pop-link"
                >
                  {isSignUp
                    ? "Already have an account? Sign in"
                    : "Don't have an account? Sign up"}
                </button>
              </div>
            </ComicPanel>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Auth;
