import { notFound } from "next/navigation";
import { ConverterPage } from "../../components/converter-page";
import { getConverterBySlug } from "../../lib/converters";

type PageProps = {
  params: {
    slug: string;
  };
};

export default function ConverterSlugPage({ params }: PageProps) {
  const converter = getConverterBySlug(params.slug);
  if (!converter) {
    notFound();
  }
  return <ConverterPage converter={converter} />;
}
