import type { Metadata } from "next";
import { LegalPageShell } from "../components/legal-page-shell";

export const metadata: Metadata = {
  title: "Privacy Policy | Umthethx",
  description:
    "Understand how Umthethx handles data for our free, ad-supported file conversion service.",
};

export default function PrivacyPage() {
  return (
    <LegalPageShell
      title="Privacy Policy"
      description="Effective date: February 4, 2026"
    >
      <p>
        This Privacy Policy explains how Umthethx handles information when you
        use the Service.
      </p>

      <section>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-[var(--foreground)]">
          1. No File Storage
        </h2>
        <ul className="mt-2 list-disc pl-5">
          <li>Files are processed only to complete conversions.</li>
          <li>Files are not permanently stored, sold, or shared.</li>
          <li>
            Files are automatically deleted after processing or shortly after
            the session ends.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-[var(--foreground)]">
          2. No Accounts or Personal Profiles
        </h2>
        <p className="mt-2">Umthethx does not require user accounts. We do not collect:</p>
        <ul className="mt-2 list-disc pl-5">
          <li>names</li>
          <li>passwords</li>
          <li>phone numbers</li>
          <li>personal profiles</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-[var(--foreground)]">
          3. Limited Technical Data
        </h2>
        <p className="mt-2">
          We may collect minimal, non-identifying technical information such as:
        </p>
        <ul className="mt-2 list-disc pl-5">
          <li>browser type</li>
          <li>device type</li>
          <li>pages visited</li>
        </ul>
        <p className="mt-2">
          This data is used only to improve performance and reliability.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-[var(--foreground)]">
          4. Cookies &amp; Advertising
        </h2>
        <ul className="mt-2 list-disc pl-5">
          <li>Cookies may be used for basic site functionality and advertising.</li>
          <li>
            Third-party ad providers may use cookies or similar technologies to
            display ads.
          </li>
          <li>
            You can manage or disable cookies through your browser settings.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-[var(--foreground)]">
          5. Data Security
        </h2>
        <p className="mt-2">
          We take reasonable technical measures to protect the Service.
          However, no online system is 100% secure.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-[var(--foreground)]">
          6. Children’s Privacy
        </h2>
        <p className="mt-2">
          Umthethx is not intended for children under 13. We do not knowingly
          collect personal data from children.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-[var(--foreground)]">
          7. Policy Updates
        </h2>
        <p className="mt-2">
          This policy may be updated occasionally. Continued use of the Service
          means you accept the revised policy.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-[var(--foreground)]">
          8. Contact
        </h2>
        <p className="mt-2">
          Questions about privacy?
          <br />
          Email: support@umthethx.com
        </p>
      </section>
    </LegalPageShell>
  );
}
