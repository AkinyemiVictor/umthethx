import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ConverterPage } from "../../../src/components/ConverterPage";
import { getConverterBySlug } from "../../../src/lib/converters";
import { getConverterMetadata } from "../../lib/seo";

type PageProps = {
  params: Promise<{
    slug: string | string[];
  }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = Array.isArray(resolvedParams.slug)
    ? resolvedParams.slug[0]
    : resolvedParams.slug;
  if (!slug) {
    notFound();
  }

  const converter = getConverterBySlug(slug);
  if (!converter) {
    notFound();
  }

  return getConverterMetadata(converter);
}

export default async function ConverterSlugPage({ params }: PageProps) {
  const resolvedParams = await params;
  const slug = Array.isArray(resolvedParams.slug)
    ? resolvedParams.slug[0]
    : resolvedParams.slug;
  if (!slug) {
    notFound();
  }
  const converter = getConverterBySlug(slug);
  if (!converter) {
    notFound();
  }
  if (converter.slug === "image-to-text") {
    permanentRedirect("/");
  }
  return <ConverterPage converter={converter} />;
}
