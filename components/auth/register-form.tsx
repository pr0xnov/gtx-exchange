"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface FieldErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  agreeToTerms?: string;
}

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    agreeToTerms: false,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();

      if (!res.ok) {
        if (json.details) {
          const fieldErrors: FieldErrors = {};
          for (const [key, msgs] of Object.entries(json.details)) {
            fieldErrors[key as keyof FieldErrors] = (msgs as string[])[0];
          }
          setErrors(fieldErrors);
        } else {
          toast.error(json.error ?? "Registration failed");
        }
        return;
      }

      toast.success("Account created — welcome to GTX!");
      router.push("/account");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="firstName">First name</Label>
          <Input
            id="firstName"
            className="mt-1.5"
            value={form.firstName}
            error={errors.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last name</Label>
          <Input
            id="lastName"
            className="mt-1.5"
            value={form.lastName}
            error={errors.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          className="mt-1.5"
          value={form.email}
          error={errors.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <div className="relative mt-1.5">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={form.password}
            error={errors.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex items-start gap-2 pt-1">
        <Checkbox
          id="agree"
          checked={form.agreeToTerms}
          onCheckedChange={(checked) =>
            setForm({ ...form, agreeToTerms: checked === true })
          }
        />
        <Label htmlFor="agree" className="cursor-pointer font-normal leading-snug">
          I agree to the{" "}
          <a href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </a>
        </Label>
      </div>
      {errors.agreeToTerms && (
        <p className="text-xs text-danger">{errors.agreeToTerms}</p>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign up"}
      </Button>
    </form>
  );
}
