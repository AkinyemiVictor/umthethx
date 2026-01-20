import { notFound, permanentRedirect } from "next/navigation";

type PageProps = {
  params: Promise<{
    slug: string | string[];
  }>;
};

export default async function ConverterSlugPage({ params }: PageProps) {
  const resolvedParams = await params;
  const slug = Array.isArray(resolvedParams.slug)
    ? resolvedParams.slug[0]
    : resolvedParams.slug;
  if (!slug) {
    notFound();
  }
  permanentRedirect(`/convert/${encodeURIComponent(slug)}`);
}
