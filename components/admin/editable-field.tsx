"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface EditableFieldProps {
  label: string;
  value: string | null | undefined;
  onSave: (newValue: string) => Promise<void>;
  type?: "text" | "email" | "date";
}

/** Inline Edit/Save/Cancel for one User field on the verification review
 *  screen (Country/Date of birth/Address/Email) — SUPER_ADMIN only (the
 *  page only ever mounts this for that role; the endpoint itself is the
 *  real enforcement). Saving always round-trips through the real admin
 *  API — there is no local-only/optimistic value that could drift from
 *  the database. */
export function EditableField({
  label,
  value,
  onSave,
  type = "text",
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit() {
    setDraft(value ?? "");
    setError(null);
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await onSave(draft.trim());
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div>
        <dt className="text-xs text-muted">{label}</dt>
        <div className="mt-1 flex items-center gap-2">
          <Input
            type={type}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="h-9 text-sm"
            autoFocus
            disabled={saving}
          />
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditing(false)}
            disabled={saving}
          >
            Cancel
          </Button>
        </div>
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 flex items-center gap-2 text-sm text-foreground">
        <span>{value || "—"}</span>
        <button
          type="button"
          onClick={startEdit}
          className="text-muted hover:text-primary"
          title={`Edit ${label}`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </dd>
    </div>
  );
}

interface EditableFullNameFieldProps {
  firstName: string;
  lastName: string;
  onSave: (firstName: string, lastName: string) => Promise<void>;
}

/** "Full name" is one field in the Personal Information block but two
 *  columns on User (firstName/lastName) — edited together in one
 *  Edit/Save/Cancel session, saved as one PATCH so both change (or
 *  neither does) together. */
export function EditableFullNameField({
  firstName,
  lastName,
  onSave,
}: EditableFullNameFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draftFirst, setDraftFirst] = useState(firstName);
  const [draftLast, setDraftLast] = useState(lastName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit() {
    setDraftFirst(firstName);
    setDraftLast(lastName);
    setError(null);
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await onSave(draftFirst.trim(), draftLast.trim());
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div>
        <dt className="text-xs text-muted">Full name</dt>
        <div className="mt-1 flex items-center gap-2">
          <Input
            value={draftFirst}
            onChange={(e) => setDraftFirst(e.target.value)}
            placeholder="First name"
            className="h-9 text-sm"
            autoFocus
            disabled={saving}
          />
          <Input
            value={draftLast}
            onChange={(e) => setDraftLast(e.target.value)}
            placeholder="Last name"
            className="h-9 text-sm"
            disabled={saving}
          />
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditing(false)}
            disabled={saving}
          >
            Cancel
          </Button>
        </div>
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <dt className="text-xs text-muted">Full name</dt>
      <dd className="mt-1 flex items-center gap-2 text-sm text-foreground">
        <span>
          {firstName} {lastName}
        </span>
        <button
          type="button"
          onClick={startEdit}
          className="text-muted hover:text-primary"
          title="Edit full name"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </dd>
    </div>
  );
}
