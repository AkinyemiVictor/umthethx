import type { ConverterCategoryIcon as ConverterCategoryIconName } from "../lib/converters";

type ConverterCategoryIconProps = {
  name: ConverterCategoryIconName;
  className?: string;
};

const iconPaths: Record<ConverterCategoryIconName, JSX.Element> = {
  "image-doc": (
    <>
      <rect x="3" y="6" width="11" height="8" rx="2" />
      <path d="M5.5 12l2-2 2.5 2.5 2-2 1.5 1.5" />
      <rect x="15" y="6" width="6" height="12" rx="1.5" />
    </>
  ),
  "image-format": (
    <>
      <rect x="3" y="6" width="9" height="7" rx="2" />
      <path d="M14 8h6" />
      <path d="m18 6 2 2-2 2" />
      <path d="M20 16h-6" />
      <path d="m16 14-2 2 2 2" />
    </>
  ),
  "image-pdf": (
    <>
      <rect x="3" y="6" width="9" height="7" rx="2" />
      <rect x="14" y="5" width="7" height="13" rx="1.5" />
      <path d="M17.5 9v5" />
      <path d="m15.5 12 2 2 2-2" />
    </>
  ),
  "doc-image": (
    <>
      <rect x="3" y="5" width="8" height="14" rx="1.5" />
      <rect x="13" y="8" width="8" height="8" rx="2" />
      <path d="M15.5 14l2-2 1.5 1.5 1.5-1.5" />
    </>
  ),
  "doc-convert": (
    <>
      <rect x="3" y="5" width="7" height="14" rx="1.5" />
      <rect x="14" y="5" width="7" height="14" rx="1.5" />
      <path d="M10 12h4" />
      <path d="m13 10 2 2-2 2" />
    </>
  ),
  "pdf-tools": (
    <>
      <rect x="4" y="4" width="9" height="14" rx="1.5" />
      <rect x="8" y="6" width="9" height="14" rx="1.5" />
      <path d="M12 10h6" />
      <path d="M12 13h6" />
    </>
  ),
  "scan-code": (
    <>
      <rect x="4" y="4" width="4" height="4" rx="1" />
      <rect x="16" y="4" width="4" height="4" rx="1" />
      <rect x="4" y="16" width="4" height="4" rx="1" />
      <rect x="12" y="12" width="2" height="2" rx="0.5" />
      <rect x="16" y="16" width="3" height="3" rx="0.5" />
    </>
  ),
  "data-tools": (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
      <path d="M9 5v14" />
      <path d="M15 5v14" />
    </>
  ),
  more: (
    <>
      <circle cx="8" cy="8" r="1.5" />
      <circle cx="16" cy="8" r="1.5" />
      <circle cx="8" cy="16" r="1.5" />
      <circle cx="16" cy="16" r="1.5" />
    </>
  ),
};

export function ConverterCategoryIcon({
  name,
  className,
}: ConverterCategoryIconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconPaths[name]}
    </svg>
  );
}
