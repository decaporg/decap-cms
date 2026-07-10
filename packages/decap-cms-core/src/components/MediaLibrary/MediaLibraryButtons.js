import React from 'react';
import PropTypes from 'prop-types';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { isAbsolutePath } from 'decap-cms-lib-util';
import { buttons, Icon, shadows, zIndex } from 'decap-cms-ui-default';

import { FileUploadButton } from '../UI';

const styles = {
  button: css`
    ${buttons.button};
    ${buttons.default};
    display: inline-flex;
    align-items: center;

    &[disabled] {
      ${buttons.disabled};
      cursor: default;
    }
  `,
  // Hides an element without removing it from the accessibility tree.
  visuallyHidden: css`
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
  `,
};

export const UploadButton = styled(FileUploadButton)`
  ${styles.button};
  ${buttons.gray};
  ${shadows.dropMain};
  margin-bottom: 0;

  span {
    font-size: 14px;
    font-weight: 500;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  input {
    height: 0.1px;
    width: 0.1px;
    margin: 0;
    padding: 0;
    opacity: 0;
    overflow: hidden;
    position: absolute;
    z-index: ${zIndex.zIndex0};
    outline: none;
  }
`;

export const DeleteButton = styled.button`
  ${styles.button};
  ${buttons.lightRed};
`;

export const InsertButton = styled.button`
  ${styles.button};
  ${buttons.green};
`;

const ActionButton = styled.button`
  ${styles.button};
  ${props =>
    !props.disabled &&
    css`
      ${buttons.gray}
    `}
`;

function ResponsiveActionButton({ children, icon, ...props }) {
  return (
    <ActionButton {...props}>
      <Icon
        type={icon}
        size="small"
        aria-hidden="true"
        css={{ '@media (min-width: 600px)': styles.visuallyHidden }}
      />
      <span css={{ '@media (max-width: 599px)': styles.visuallyHidden }}>{children}</span>
    </ActionButton>
  );
}

export function DownloadButton({ children, ...props }) {
  return (
    <ResponsiveActionButton {...props} icon="download">
      {children}
    </ResponsiveActionButton>
  );
}

export class CopyToClipBoardButton extends React.Component {
  mounted = false;
  timeout;

  state = {
    copied: false,
  };

  componentDidMount() {
    this.mounted = true;
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  handleCopy = async () => {
    clearTimeout(this.timeout);
    const { path, draft, name } = this.props;
    await navigator.clipboard.writeText(isAbsolutePath(path) || !draft ? path : name);
    this.setState({ copied: true });
    this.timeout = setTimeout(() => this.mounted && this.setState({ copied: false }), 1500);
  };

  getTitle = () => {
    const { t, path, draft } = this.props;
    if (this.state.copied) {
      return t('mediaLibrary.mediaLibraryCard.copied');
    }

    if (!path) {
      return t('mediaLibrary.mediaLibraryCard.copy');
    }

    if (isAbsolutePath(path)) {
      return t('mediaLibrary.mediaLibraryCard.copyUrl');
    }

    if (draft) {
      return t('mediaLibrary.mediaLibraryCard.copyName');
    }

    return t('mediaLibrary.mediaLibraryCard.copyPath');
  };

  getIcon = () => (this.state.copied ? 'check' : 'copy');

  render() {
    const { disabled } = this.props;

    return (
      <ResponsiveActionButton disabled={disabled} onClick={this.handleCopy} icon={this.getIcon()}>
        {this.getTitle()}
      </ResponsiveActionButton>
    );
  }
}

CopyToClipBoardButton.propTypes = {
  disabled: PropTypes.bool.isRequired,
  draft: PropTypes.bool,
  path: PropTypes.string,
  name: PropTypes.string,
  t: PropTypes.func.isRequired,
};
