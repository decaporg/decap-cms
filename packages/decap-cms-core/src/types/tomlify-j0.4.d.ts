declare module 'tomlify-j0.4' {
  interface ToTomlOptions {
    replace?(key: string, value: unknown): string | false;
    sort?(a: string, b: string): number;
  }

  interface Tomlify {
    toToml(data: object, options?: ToTomlOptions): string;
  }

  const tomlify: Tomlify;
  export default tomlify;
}
