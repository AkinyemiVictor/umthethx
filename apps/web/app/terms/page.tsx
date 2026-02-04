import type { Metadata } from "next";
import { LegalPageShell } from "../components/legal-page-shell";

export const metadata: Metadata = {
  title: "Terms & Conditions | Umthethx",
  description:
    "Review the Umthethx Terms & Conditions for using our free, ad-supported online file converter.",
};

export default function TermsPage() {
  return (
    <LegalPageShell
      title="Terms & Conditions"
      description="Effective date: February 4, 2026"
    >
      <p>
        Welcome to Umthethx (“we”, “our”, “us”). By accessing or using this
        website and its tools (the “Service”), you agree to these Terms &amp;
        Conditions. If you do not agree, please do not use the Service.
      </p>

      <section>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-[var(--foreground)]">
          1. Service Description
        </h2>
        <p className="mt-2">
          Umthethx is a free, ad-supported online file conversion tool. The
          Service allows users to upload files and convert them into supported
          formats.
        </p>
        <p className="mt-2">
          The Service is provided “as is” and “as available.” No paid plans,
          subscriptions, or fees currently apply.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-[var(--foreground)]">
          2. Eligibility
        </h2>
        <p className="mt-2">
          You must be at least 13 years old to use Umthethx. By using the
          Service, you confirm that you meet this requirement.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-[var(--foreground)]">
          3. No Warranties
        </h2>
        <p className="mt-2">We make no guarantees that:</p>
        <ul className="mt-2 list-disc pl-5">
          <li>the Service will always be available or uninterrupted</li>
          <li>conversions will always succeed or be error-free</li>
          <li>converted files will meet your specific needs</li>
        </ul>
        <p className="mt-2">You use Umthethx at your own risk.</p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-[var(--foreground)]">
          4. User Files &amp; Responsibility
        </h2>
        <ul className="mt-2 list-disc pl-5">
          <li>You retain full ownership of any files you upload.</li>
          <li>You are solely responsible for the content of your files.</li>
          <li>
            You confirm that you have the legal right to upload, process, and
            convert the files you submit.
          </li>
          <li>Umthethx does not claim ownership of your content.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-[var(--foreground)]">
          5. Acceptable Use
        </h2>
        <p className="mt-2">You agree not to use Umthethx to:</p>
        <ul className="mt-2 list-disc pl-5">
          <li>upload malware, harmful code, or malicious files</li>
          <li>upload illegal, abusive, or infringing content</li>
          <li>attempt unauthorized access to our systems</li>
          <li>overload, scrape, reverse-engineer, or disrupt the Service</li>
        </ul>
        <p className="mt-2">
          We reserve the right to block or restrict access if misuse is
          detected.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-[var(--foreground)]">
          6. Ads &amp; Third-Party Services
        </h2>
        <p className="mt-2">Umthethx is supported by advertisements.</p>
        <ul className="mt-2 list-disc pl-5">
          <li>
            Ads may be delivered by third-party providers who operate under
            their own terms and privacy policies.
          </li>
          <li>
            We are not responsible for third-party content, products, or
            services shown in ads.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-[var(--foreground)]">
          7. Limitation of Liability
        </h2>
        <p className="mt-2">
          To the maximum extent permitted by law, Umthethx is not liable for:
        </p>
        <ul className="mt-2 list-disc pl-5">
          <li>loss of files or data</li>
          <li>failed or incorrect conversions</li>
          <li>indirect, incidental, or consequential damages</li>
        </ul>
        <p className="mt-2">Always keep backups of important files.</p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-[var(--foreground)]">
          8. Changes to the Service &amp; Terms
        </h2>
        <p className="mt-2">We may:</p>
        <ul className="mt-2 list-disc pl-5">
          <li>modify, suspend, or discontinue features at any time</li>
          <li>update these Terms when needed</li>
        </ul>
        <p className="mt-2">
          Continued use of the Service means you accept any changes.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-[var(--foreground)]">
          9. Contact
        </h2>
        <p className="mt-2">
          For questions or concerns, contact us at:
          <br />
          Email: support@umthethx.com
        </p>
      </section>
    </LegalPageShell>
  );
}
