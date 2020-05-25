import { css } from '@emotion/core';
import styled from '@emotion/styled';
import { FileUploadButton } from 'UI';
import { buttons, colors, colorsRaw, shadows, zIndex } from 'netlify-cms-ui-default';

const styles = {
  button: css`
    ${buttons.button};
    ${buttons.default};
    display: inline-block;
    margin-left: 15px;
    margin-right: 2px;

    &[disabled] {
      ${buttons.disabled};
      cursor: default;
    }
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

export const DownloadButton = styled.button`
  ${styles.button};
  background-color: ${colors.button};
  color: ${colors.buttonText};

  ${props =>
    props.focused === true &&
    css`
      &:focus,
      &:hover {
        color: ${colorsRaw.white};
        background-color: #555a65;
      }
    `}
`;
