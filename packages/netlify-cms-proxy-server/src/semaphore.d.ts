declare module 'semaphore' {
  export type Semaphore = { take: (f: Function) => void; leave: () => void };
  const semaphore: (count: number) => Semaphore;
  export default semaphore;
}
