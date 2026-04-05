import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ConverterPage } from "../../../src/components/ConverterPage";
import { getConverterBySlug, getConverterHref } from "../../../src/lib/converters";
import { getCurrentMarket } from "../../lib/markets";
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

  const market = await getCurrentMarket();

  return getConverterMetadata(converter, market);
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
    const market = await getCurrentMarket();
    permanentRedirect(getConverterHref(converter, market));
  }
  return <ConverterPage converter={converter} />;
}
