"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // 2. Create a secure cookie so Middleware knows we are an Admin
      // (In a full production app you'd verify this server-side, but this is great for MVP)
      document.cookie = `session=${userCredential.user.uid}; path=/; max-age=86400; SameSite=Strict`;
      
      // 3. Redirect to the Admin Menu page
      router.push("/admin/menu");
    } catch (err: any) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-lg bg-card border-border shadow-2xl">
        <CardHeader className="space-y-2 text-center pb-6 pt-8">
          <CardTitle className="text-3xl md:text-4xl font-extrabold text-primary">Xodimlar paneli</CardTitle>
          <CardDescription className="text-muted-foreground max-w-prose mx-auto">
            Tizimga kirish uchun elektron pochta va parolingizni kiriting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Elektron pochta</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@yalla.uz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="h-12 text-lg bg-input border-border text-foreground focus-visible:ring-primary"
                aria-label="Elektron pochta"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Parol</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Parolingizni kiriting"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 text-lg bg-input border-border text-foreground pr-12 focus-visible:ring-primary"
                  aria-label="Parol"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center p-1 rounded-md text-gray-500 hover:text-gray-900"
                  aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive font-medium text-center">Elektron pochta yoki parol noto'g'ri. Iltimos qayta urinib ko'ring.</p>
            )}

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-lg h-14 rounded-lg"
              disabled={loading}
            >
              {loading ? "Kirish..." : "Kirish"}
            </Button>

            <div className="flex items-center justify-between text-sm text-gray-500">
              <button
                type="button"
                onClick={() => {
                  // simple client-side hint; route not implemented
                  alert("Iltimos administrator bilan bog'laning: admin@yalla.uz");
                }}
                className="underline"
              >
                Parolni unutdingiz?
              </button>
              <div className="text-xs">Yalla</div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}