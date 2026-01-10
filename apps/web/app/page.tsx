import { ConverterPage } from "./components/converter-page";
import { getConverterBySlug } from "./lib/converters";

export default function Home() {
  const converter = getConverterBySlug("image-to-text");
  if (!converter) {
    return null;
  }
  return <ConverterPage converter={converter} />;
}
