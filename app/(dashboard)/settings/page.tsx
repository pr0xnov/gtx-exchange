"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/use-api";
import { Skeleton } from "@/components/shared/skeleton";

function ToggleRow({
  label,
  description,
  defaultChecked = false,
}: {
  label: string;
  description: string;
  defaultChecked?: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="text-xs text-muted">{description}</div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => setChecked((c) => !c)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-white/10"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { data: user, isLoading } = useCurrentUser();

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {isLoading ? (
            <>
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
            </>
          ) : (
            <>
              <div>
                <Label>First name</Label>
                <Input className="mt-1.5" defaultValue={user?.firstName} />
              </div>
              <div>
                <Label>Last name</Label>
                <Input className="mt-1.5" defaultValue={user?.lastName} />
              </div>
              <div className="sm:col-span-2">
                <Label>E-mail</Label>
                <Input className="mt-1.5" defaultValue={user?.email} disabled />
              </div>
            </>
          )}
          <div className="sm:col-span-2">
            <Button onClick={() => toast.success("Profile updated")}>
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password &amp; Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Current password</Label>
              <Input type="password" className="mt-1.5" placeholder="••••••••" />
            </div>
            <div>
              <Label>New password</Label>
              <Input type="password" className="mt-1.5" placeholder="••••••••" />
            </div>
          </div>
          <ToggleRow
            label="Two-factor authentication (2FA)"
            description="Add an extra layer of security to your account"
          />
          <Button
            variant="outline"
            onClick={() => toast.success("Password updated")}
          >
            Update password
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          <ToggleRow
            label="E-mail notifications"
            description="Receive updates about deposits, withdrawals and trades"
            defaultChecked
          />
          <ToggleRow
            label="Push notifications"
            description="Get notified in real time on this device"
            defaultChecked
          />
          <ToggleRow
            label="Market alerts"
            description="Notify me about significant price movements"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Language &amp; Theme</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Language</Label>
            <select className="mt-1.5 h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm text-foreground">
              <option>English</option>
              <option>Русский</option>
              <option>Українська</option>
            </select>
          </div>
          <div>
            <Label>Theme</Label>
            <select
              className="mt-1.5 h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm text-foreground"
              defaultValue="dark"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted">
            Generate API credentials to connect third-party tools to your paper
            trading account.
          </p>
          <Button variant="outline" onClick={() => toast.success("API key generated")}>
            Generate new key
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
