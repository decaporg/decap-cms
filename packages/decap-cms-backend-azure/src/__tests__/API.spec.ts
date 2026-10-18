import API from '../API';

describe('azure API', () => {
  function createApi() {
    return new API(
      {
        apiRoot: 'https://dev.azure.com',
        apiVersion: '6.1-preview',
        repo: { org: 'org', project: 'project', repoName: 'repo' },
        branch: 'main',
        squashMerges: false,
        initialWorkflowStatus: 'draft',
        cmsLabelPrefix: 'decap-cms/',
      },
      'token',
    );
  }

  describe('user', () => {
    it('should use the email address as the login', async () => {
      const api = createApi();
      api.requestJSON = jest.fn().mockResolvedValue({
        coreAttributes: {
          DisplayName: { value: 'Jane Doe' },
          EmailAddress: { value: 'jane@example.com' },
          Avatar: { value: { value: 'avatar' } },
        },
      });

      await expect(api.user()).resolves.toEqual({
        name: 'Jane Doe',
        login: 'jane@example.com',
        email: 'jane@example.com',
        avatar_url: 'data:image/png;base64,avatar',
      });
    });
  });
});
