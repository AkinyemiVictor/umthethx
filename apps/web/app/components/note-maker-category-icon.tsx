import type { ReactElement } from "react";
import type { NoteMakerCategoryIconName } from "../lib/ai-notemaker-types";

type NoteMakerCategoryIconProps = {
  name: NoteMakerCategoryIconName;
  className?: string;
};

const iconPaths: Record<NoteMakerCategoryIconName, ReactElement> = {
  general: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="2" fill="#e0e7ff" />
      <path d="M7 9h10" />
      <path d="M7 12h10" />
      <path d="M7 15h6" />
    </>
  ),
  academic: (
    <>
      <path d="M3 9l9-4 9 4-9 4-9-4z" fill="#c7d2fe" />
      <path d="M8 12v3c2 1 6 1 8 0v-3" />
      <path d="M12 13v5" />
      <circle cx="12" cy="18.5" r="1" fill="#fef08a" stroke="none" />
    </>
  ),
  medical: (
    <>
      <rect x="9.5" y="4" width="5" height="16" rx="1.2" fill="#fecaca" />
      <rect x="4" y="9.5" width="16" height="5" rx="1.2" fill="#fecaca" />
    </>
  ),
  legal: (
    <>
      <path d="M12 4v15" />
      <path d="M6 7h12" />
      <path d="M6 7l-3 5h6l-3-5z" fill="#fde68a" />
      <path d="M18 7l-3 5h6l-3-5z" fill="#fde68a" />
      <rect x="9" y="18" width="6" height="2" rx="1" fill="#fef3c7" />
    </>
  ),
  business: (
    <>
      <rect x="4" y="7" width="16" height="10" rx="2" fill="#bbf7d0" />
      <rect x="9" y="5" width="6" height="3" rx="1" fill="#a7f3d0" />
      <path d="M4 11h16" />
    </>
  ),
  engineering: (
    <>
      <circle cx="12" cy="12" r="4" fill="#bfdbfe" />
      <path d="M12 3v3" />
      <path d="M12 18v3" />
      <path d="M3 12h3" />
      <path d="M18 12h3" />
      <path d="M5.5 5.5l2 2" />
      <path d="M16.5 16.5l2 2" />
      <path d="M5.5 18.5l2-2" />
      <path d="M16.5 7.5l2-2" />
    </>
  ),
  finance: (
    <>
      <circle cx="12" cy="10" r="5" fill="#fcd34d" />
      <path d="M7 16c0 2 10 2 10 0" />
      <path d="M8.5 13.5h7" />
    </>
  ),
  education: (
    <>
      <path
        d="M5 6h6a2 2 0 0 1 2 2v11H7a2 2 0 0 0-2 2V6z"
        fill="#e9d5ff"
      />
      <path
        d="M19 6h-6a2 2 0 0 0-2 2v11h6a2 2 0 0 1 2 2V6z"
        fill="#c4b5fd"
      />
      <path d="M8 9h3" />
      <path d="M13 9h3" />
    </>
  ),
  media: (
    <>
      <rect x="9" y="4" width="6" height="10" rx="3" fill="#a7f3d0" />
      <path d="M6 10a6 6 0 0 0 12 0" />
      <path d="M12 16v4" />
      <path d="M9 20h6" />
    </>
  ),
};

export function NoteMakerCategoryIcon({
  name,
  className,
}: NoteMakerCategoryIconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconPaths[name]}
    </svg>
  );
}
