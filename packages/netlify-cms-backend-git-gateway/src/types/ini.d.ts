declare module 'ini' {
  const ini: { decode: <T>(ini: string) => T };
  export default ini;
}
