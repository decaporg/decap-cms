import React from 'react';
import { css } from '@emotion/core';

function EditLink({ collection, filename }) {
  return (
    <div
      css={css`
        float: right;

        a {
          font-weight: 700;
        }

        #pencil {
          fill: #7ca511;
        }
      `}
    >
      <a href={`/admin/#/edit/${collection}/${filename}`} target="_blank" rel="noopener noreferrer">
        <svg
          version="1.1"
          id="pencil"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          x="0px"
          y="0px"
          width="14px"
          height="14px"
          viewBox="0 0 512 512"
          enableBackground="new 0 0 512 512"
          xmlSpace="preserve"
        >
          <path
            d="M398.875,248.875L172.578,475.187l-22.625-22.625L376.25,226.265L398.875,248.875z M308.375,158.39L82.063,384.687
    l45.266,45.25L353.625,203.64L308.375,158.39z M263.094,113.125L36.828,339.437l22.625,22.625L285.75,135.765L263.094,113.125z
     M308.375,67.875L285.719,90.5L421.5,226.265l22.625-22.625L308.375,67.875z M376.25,0L331,45.25l135.75,135.766L512,135.781
    L376.25,0z M32,453.5V480h26.5L32,453.5 M0,376.25L135.766,512H0V376.25L0,376.25z"
          />
        </svg>{' '}
        Edit this page
      </a>
    </div>
  );
}

export default EditLink;
