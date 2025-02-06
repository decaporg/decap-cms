declare module '@iarna/toml/parse-string' {
  import type { JsonMap } from '@iarna/toml';
  export default function (toml: string): JsonMap;
}
