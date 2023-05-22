import React, { PureComponent } from 'react';

class GitHubStarButton extends PureComponent {
  async componentDidMount() {
    const gitHubButtonModule = await import('github-buttons/dist/react');

    this.GitHubButton = gitHubButtonModule.default;

    this.forceUpdate();
  }

  render() {
    const GitHubButton = this.GitHubButton;

    if (!GitHubButton) {
      return null;
    }

    return (
      <GitHubButton
        href="https://github.com/decaporg/decap-cms"
        data-icon="octicon-star"
        data-show-count="true"
        aria-label="Star decaporg/decap-cms on GitHub"
      >
        Star
      </GitHubButton>
    );
  }
}

export default GitHubStarButton;
