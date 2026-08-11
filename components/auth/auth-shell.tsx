import Link from "next/link";
import { Logo } from "@/components/shared/logo";

export function AuthShell({
  title,
  children,
  footer,
}: {
  title: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="absolute inset-0 bg-grid-fade bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_20%,black,transparent)]" />
      <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-md animate-fade-up rounded-3xl border border-border bg-card p-8 shadow-elevated">
        <Link href="/" className="mb-8 flex justify-center">
          <Logo />
        </Link>
        <h1 className="mb-6 text-center text-2xl font-bold text-foreground">{title}</h1>
        {children}
        <div className="mt-6 text-center text-sm text-muted">{footer}</div>
      </div>
    </div>
  );
}
