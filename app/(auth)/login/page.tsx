import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Registration
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
