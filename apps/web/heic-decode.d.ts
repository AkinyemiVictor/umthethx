declare module "heic-decode" {
  type HeicDecodeImage = {
    width: number;
    height: number;
    data: ArrayBuffer;
  };

  type HeicDecodeResult = HeicDecodeImage | HeicDecodeImage[];

  type DecodeFn = (options: {
    buffer: Buffer | Uint8Array;
  }) => Promise<HeicDecodeResult> | HeicDecodeResult;

  type DecodeAllImage = {
    decode: () => Promise<HeicDecodeImage>;
  };

  const decode: DecodeFn & {
    all?: (options: { buffer: Buffer | Uint8Array }) => Promise<DecodeAllImage[]>;
  };

  export = decode;
}
