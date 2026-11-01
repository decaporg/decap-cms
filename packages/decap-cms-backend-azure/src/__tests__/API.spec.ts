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
      expect(api.requestJSON).toHaveBeenCalledWith({
        url: 'https://app.vssps.visualstudio.com/_apis/profile/profiles/me',
        params: { 'api-version': '6.1-preview.2' },
      });
    });

    it('should read top-level profile fields when coreAttributes is missing', async () => {
      const api = createApi();
      api.requestJSON = jest.fn().mockResolvedValue({
        displayName: 'Jane Doe',
        emailAddress: 'jane@example.com',
      });

      const user = await api.user();

      expect(user.name).toBe('Jane Doe');
      expect(user.login).toBe('jane@example.com');
      expect(user.email).toBe('jane@example.com');
    });

    it('should fall back to the display name for the login when there is no email', async () => {
      const api = createApi();
      api.requestJSON = jest.fn().mockResolvedValue({
        coreAttributes: { DisplayName: { value: 'Jane Doe' } },
      });

      const user = await api.user();

      expect(user.login).toBe('Jane Doe');
      expect(user.email).toBeUndefined();
    });

    it('should not set an avatar URL when the profile has no avatar', async () => {
      const api = createApi();
      api.requestJSON = jest.fn().mockResolvedValue({
        coreAttributes: { DisplayName: { value: 'Jane Doe' } },
      });

      const user = await api.user();

      expect(user.avatar_url).toBeUndefined();
    });
  });
});
