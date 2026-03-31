import type { Metadata } from "next";
import { LegalPageShell } from "../components/legal-page-shell";

export const metadata: Metadata = {
  title: "Contact Us | Umthethx",
  description: "Get help, report a bug, or share feedback with Umthethx.",
};

export default function ContactPage() {
  return (
    <LegalPageShell
      title="Contact Us"
      description="Need help, spotted a bug, or have feedback?"
    >
      <section>
        <p>
          Email: <span className="font-semibold">contactumthethx@gmail.com</span>
        </p>
        <p className="mt-2">Response time: 24–72 hours (business days)</p>
      </section>
      <p>
        We may not reply instantly, but every message helps improve Umthethx.
      </p>
    </LegalPageShell>
  );
}
