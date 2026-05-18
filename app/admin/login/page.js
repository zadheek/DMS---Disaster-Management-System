"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AlertTriangle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    searchParams.get("error") ? "Invalid email or password" : ""
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/admin");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="flex flex-col items-center justify-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex flex-shrink-0 items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-[var(--accent)]" />
          </div>
          <div className="text-center">
            <h1 className="font-bold text-2xl text-[var(--text-primary)] tracking-tight">DMS</h1>
            <p className="text-sm font-medium text-[var(--text-muted)] tracking-wide mt-1 uppercase">Disaster Management System</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">Admin Sign In</h2>
            <p className="text-[10px] font-medium text-[var(--text-muted)] mt-1.5 uppercase tracking-widest whitespace-nowrap">
              Restricted access — administrators only
            </p>
          </div>

          {error && (
            <div className="bg-[var(--critical)]/10 border border-[var(--critical)]/20 rounded-lg px-4 py-3 mb-6">
              <p className="text-sm text-[var(--critical)]">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@dms.local"
                required
                autoComplete="email"
                className="bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] h-11 px-4 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider">Password</Label>
              <div className="relative flex items-center">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)] pr-11 h-11 px-4 rounded-xl w-full"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-0 top-0 h-11 w-11 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors rounded-r-xl"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white h-11 rounded-xl font-semibold shadow-sm transition-all mt-6"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-[var(--text-muted)] mt-8 font-medium">
          Public users do not need to sign in.{" "}
          <a href="/map" className="text-[var(--text-primary)] underline decoration-[var(--border)] underline-offset-4 hover:decoration-[var(--accent)] transition-all">
            Go to public map
          </a>
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
