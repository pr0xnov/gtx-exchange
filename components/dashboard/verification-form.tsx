"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUploadRow } from "@/components/dashboard/file-upload-row";
import { useLocale } from "@/lib/i18n/locale-context";

export function VerificationForm() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [country, setCountry] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [identityFile, setIdentityFile] = useState<File | null>(null);
  const [addressFile, setAddressFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!country.trim() || !dateOfBirth || !address.trim()) {
      toast.error(t("verification.missingInfoError"));
      return;
    }
    if (!identityFile || !addressFile) {
      toast.error(t("verification.missingDocsError"));
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.set("country", country.trim());
      form.set("dateOfBirth", dateOfBirth);
      form.set("address", address.trim());
      form.set("identityFile", identityFile);
      form.set("addressFile", addressFile);

      const res = await fetch("/api/verification", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(t("verification.submitSuccess"));
      await queryClient.invalidateQueries({ queryKey: ["verification"] });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("verification.submitFailedFallback")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="ver-country">{t("verification.countryLabel")}</Label>
        <Input
          id="ver-country"
          className="mt-1.5"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder={t("verification.countryPlaceholder")}
        />
      </div>

      <div>
        <Label htmlFor="ver-dob">{t("verification.dateOfBirthLabel")}</Label>
        <Input
          id="ver-dob"
          type="date"
          className="mt-1.5"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="ver-address">{t("verification.addressLabel")}</Label>
        <Input
          id="ver-address"
          className="mt-1.5"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={t("verification.addressPlaceholder")}
        />
      </div>

      <FileUploadRow
        label={t("verification.identityDocumentLabel")}
        onFileSelected={setIdentityFile}
      />
      <FileUploadRow
        label={t("verification.proofOfAddressLabel")}
        onFileSelected={setAddressFile}
      />

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          t("verification.submitButton")
        )}
      </Button>
    </form>
  );
}
