import type { Metadata } from "next";
import { LegalPageShell } from "../components/legal-page-shell";

export const metadata: Metadata = {
  title: "Refund Policy | Umthethx",
  description:
    "Umthethx is a free, ad-supported service and does not charge for conversions.",
};

export default function RefundsPage() {
  return (
    <LegalPageShell
      title="Refund Policy"
      description="Umthethx is a free service supported by ads."
    >
      <p>We do not charge users for conversions.</p>
      <p>Because no payments are collected, refunds do not apply.</p>
      <p>
        If paid features are introduced in the future, this policy will be
        updated.
      </p>
    </LegalPageShell>
  );
}
