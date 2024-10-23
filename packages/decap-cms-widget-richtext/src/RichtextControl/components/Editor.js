import React from 'react';
import { PlateContent } from '@udecode/plate-common/react';
import { ClassNames } from '@emotion/react';

function Editor(props) {
  const { isDisabled } = props;

  return (
    <ClassNames>
      {({ css }) => (
        <PlateContent
          className={css`
            flex-grow: 1;
            padding: 16px 20px 0;
            outline: none;
          `}
          disableDefaultStyles
          readOnly={isDisabled}
          aria-disabled={isDisabled}
        />
      )}
    </ClassNames>
  );
}

export default Editor;
