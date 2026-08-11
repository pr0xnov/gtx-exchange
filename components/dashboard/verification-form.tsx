"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileUploadRow } from "@/components/dashboard/file-upload-row";

export function VerificationForm() {
  const [identityFile, setIdentityFile] = useState<string | null>(null);
  const [addressFile, setAddressFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!identityFile || !addressFile) {
      toast.error("Please upload both required documents");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identityFileName: identityFile,
          addressFileName: addressFile,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success("Documents submitted for review");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FileUploadRow label="Identity document" onFileSelected={setIdentityFile} />
      <FileUploadRow label="Proof of address" onFileSelected={setAddressFile} />

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit documents"}
      </Button>
    </form>
  );
}
