import type { Converter } from "../lib/converters";
import { ConverterPage as AppConverterPage } from "../../app/components/converter-page";

export function ConverterPage({ converter }: { converter: Converter }) {
  return <AppConverterPage converter={converter} />;
}
