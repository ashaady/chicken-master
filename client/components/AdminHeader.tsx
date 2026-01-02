import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AdminHeaderProps {
  userName: string;
  role: "admin" | "manager";
  soundEnabled?: boolean;
  onSoundToggle?: (enabled: boolean) => void;
}

export default function AdminHeader({
  userName,
  role,
  soundEnabled = true,
  onSoundToggle,
}: AdminHeaderProps) {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    if (confirm("Voulez-vous vraiment vous déconnecter ?")) {
      setIsLoggingOut(true);
      localStorage.removeItem("admin_session");
      toast.success("Déconnexion réussie");
      setTimeout(() => {
        navigate("/admin/login");
      }, 300);
    }
  };

  const toggleSound = () => {
    const newValue = !soundEnabled;
    onSoundToggle?.(newValue);
    localStorage.setItem("admin_sound_enabled", newValue.toString());
    toast.success(newValue ? "🔊 Son activé" : "🔇 Son désactivé");
  };

  const getRoleBadge = () => {
    if (role === "manager") {
      return (
        <div className="flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full">
          <span className="text-xl">👔</span>
          <span className="font-semibold text-purple-800">MANAGER</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full">
        <span className="text-xl">👤</span>
        <span className="font-semibold text-blue-800">ADMIN</span>
      </div>
    );
  };

  return (
    <div className="bg-chicken-navy text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="text-4xl">🍗</div>
            <div>
              <h1 className="text-2xl font-bold">Chicken Master</h1>
              <p className="text-xs text-white/70">Dashboard Admin</p>
            </div>
          </div>

          {/* Center: Role Badge */}
          <div>{getRoleBadge()}</div>

          {/* Right: User Info and Actions */}
          <div className="flex items-center gap-4 ml-auto">
            {/* User Name */}
            <div className="hidden sm:block text-right">
              <p className="font-semibold text-sm">{userName}</p>
              <p className="text-xs text-white/70">Connecté</p>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
              title={soundEnabled ? "Désactiver le son" : "Activer le son"}
            >
              {soundEnabled ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </button>

            {/* Logout Button */}
            <Button
              onClick={handleLogout}
              disabled={isLoggingOut}
              variant="outline"
              className="text-white border-white hover:bg-white/10 gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </Button>

            {/* Back to Site Link */}
            <a
              href="/"
              className="p-2 rounded-lg hover:bg-white/20 transition-colors text-white font-semibold"
              title="Retour au site"
            >
              🏠
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
