import GitLabBackend from './implementation';
import API from './API';
import AuthenticationPage from './AuthenticationPage';
import { GitLabNotesAPI } from './notesApi';

export const DecapCmsBackendGitlab = {
  GitLabBackend,
  API,
  AuthenticationPage,
  GitLabNotesAPI,
};
export { GitLabBackend, API, AuthenticationPage, GitLabNotesAPI };
