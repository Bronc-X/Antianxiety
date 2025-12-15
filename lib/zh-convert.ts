import * as OpenCC from 'opencc-js';

let cnToTwConverter: ((input: string) => string) | null = null;

export function cnToTw(input: string): string {
  if (!input) return input;
  if (!cnToTwConverter) {
    cnToTwConverter = OpenCC.Converter({ from: 'cn', to: 'tw' });
  }
  return cnToTwConverter(input);
}

