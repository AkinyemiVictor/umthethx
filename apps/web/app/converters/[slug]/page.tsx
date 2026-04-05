import { notFound, permanentRedirect } from "next/navigation";
import { getCurrentMarket, prefixMarketPath } from "../../lib/markets";

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
  const market = await getCurrentMarket();
  permanentRedirect(
    prefixMarketPath(`/convert/${encodeURIComponent(slug)}`, market),
  );
}
