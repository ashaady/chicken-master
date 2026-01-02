import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || "Erreur de connexion");
        return;
      }

      const data = await response.json();

      // Save session to localStorage
      localStorage.setItem(
        "admin_session",
        JSON.stringify({
          user_id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          logged_in_at: new Date().toISOString(),
        })
      );

      toast.success(`Bienvenue ${data.user.name}!`);

      // Redirect to dashboard
      setTimeout(() => {
        navigate("/admin/dashboard");
      }, 500);
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-red-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🍗</div>
          <h1 className="text-4xl font-black text-white mb-2">CHICKEN MASTER</h1>
          <p className="text-white/80 text-lg">Dashboard Admin</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-2">
                Adresse email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="admin@chickenmaster.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:bg-white transition-all"
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-foreground mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:bg-white transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold text-lg rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Connexion...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>
        </div>

        {/* Demo Accounts */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-white">
          <h3 className="font-bold text-lg mb-4">👤 Comptes de démonstration:</h3>

          <div className="space-y-3">
            {/* Manager Account */}
            <div className="bg-white/10 rounded-lg p-4 border border-white/20">
              <p className="text-sm font-semibold mb-1">👔 Manager (Gérant)</p>
              <p className="text-xs text-white/80 font-mono">
                Email: manager@chickenmaster.com
              </p>
              <p className="text-xs text-white/80 font-mono">
                Mot de passe: Manager2026!
              </p>
            </div>

            {/* Admin Account */}
            <div className="bg-white/10 rounded-lg p-4 border border-white/20">
              <p className="text-sm font-semibold mb-1">👤 Admin (Employé)</p>
              <p className="text-xs text-white/80 font-mono">
                Email: admin@chickenmaster.com
              </p>
              <p className="text-xs text-white/80 font-mono">
                Mot de passe: Admin2026!
              </p>
            </div>
          </div>

          <p className="text-xs text-white/60 mt-4 text-center">
            💡 Utilisez un compte pour explorer les différents rôles
          </p>
        </div>

        {/* Back to Site Link */}
        <div className="text-center mt-6">
          <a href="/" className="text-white/80 hover:text-white text-sm font-medium transition-colors">
            ← Retour au site
          </a>
        </div>
      </div>
    </div>
  );
}
