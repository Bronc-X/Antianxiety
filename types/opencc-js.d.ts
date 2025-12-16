declare module 'opencc-js' {
  export type ConverterOptions = { from: string; to: string };
  export type ConverterFn = (input: string) => string;

  export function Converter(options: ConverterOptions): ConverterFn;

  // Additional exports exist; keep them loosely typed.
  export const ConverterFactory: any;
  export const CustomConverter: any;
  export const HTMLConverter: any;
  export const Locale: any;
  export const Trie: any;
}

