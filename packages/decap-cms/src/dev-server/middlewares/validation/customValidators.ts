import { resolveRepoPath } from '@/dev-server/middlewares/utils/path';

export function pathTraversal(repoPath: string) {
  return (value: string) => {
    try {
      resolveRepoPath(repoPath, value);
      return undefined;
    } catch (e: unknown) {
      return 'must resolve to a path under the configured repository';
    }
  };
}
