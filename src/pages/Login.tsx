import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { isFirebaseConfigured } from "@/lib/firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Completá todos los campos");
      return;
    }
    if (!isFirebaseConfigured) {
      // Demo mode: accept any credentials
      navigate("/admin");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      navigate("/admin");
    } catch {
      setError("Email o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-card rounded-xl border border-border shadow-lg p-8 w-full max-w-sm space-y-6"
      >
        <div className="text-center">
          <h1 className="font-heading text-3xl font-bold text-accent">Distec</h1>
          <p className="text-sm text-muted-foreground mt-1">Panel de administración</p>
        </div>

        {!isFirebaseConfigured && (
          <div className="bg-muted p-3 rounded-lg text-xs text-muted-foreground text-center">
            Modo demo — ingresá cualquier dato para acceder
          </div>
        )}

        {error && (
          <p className="text-destructive text-sm text-center bg-destructive/10 p-2 rounded">{error}</p>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="admin@distec.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Ingresar
        </button>
      </form>
    </div>
  );
}
