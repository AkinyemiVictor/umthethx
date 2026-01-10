import { notFound } from "next/navigation";
import { ConverterPage } from "../../components/converter-page";
import { getConverterBySlug } from "../../lib/converters";

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
  const converter = getConverterBySlug(slug);
  if (!converter) {
    notFound();
  }
  return <ConverterPage converter={converter} />;
}
