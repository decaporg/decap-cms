import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
// import { css } from '@emotion/react';
import { List } from 'immutable';
import {
  // Toggle,
  // Dropdown,
  // DropdownItem,
  // DropdownButton,
  colors,
  transitions,
} from 'decap-cms-ui-default';
import { MARK_BOLD, MARK_CODE, MARK_ITALIC } from '@udecode/plate-basic-marks';

// import ToolbarButton from './ToolbarButton';
import MarkToolbarButton from './MarkToolbarButton';

// import ToolbarButton from './ToolbarButton';

const ToolbarContainer = styled.div`
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 11px 14px;
  min-height: 58px;
  transition: background-color ${transitions.main}, color ${transitions.main};
  color: ${colors.text};
`;

// const ToolbarDropdownWrapper = styled.div`
//   display: inline-block;
//   position: relative;
// `;

// const ToolbarToggle = styled.div`
//   flex-shrink: 0;
//   display: flex;
//   align-items: center;
//   font-size: 14px;
//   margin: 0 10px;
// `;

// const StyledToggle = ToolbarToggle.withComponent(Toggle);

// const ToolbarToggleLabel = styled.span`
//   display: inline-block;
//   text-align: center;
//   white-space: nowrap;
//   line-height: 20px;
//   min-width: ${props => (props.offPosition ? '62px' : '70px')};

//   ${props =>
//     props.isActive &&
//     css`
//       font-weight: 600;
//       color: ${colors.active};
//     `};
// `;

function Toolbar(props) {
  const { disabled, t } = props;

  function isVisible(button) {
    const { buttons } = props;
    return !List.isList(buttons) || buttons.includes(button);
  }

  return (
    <ToolbarContainer>
      <div>
        {isVisible('bold') && (
          <MarkToolbarButton
            type="bold"
            nodeType={MARK_BOLD}
            label={t('editor.editorWidgets.markdown.bold')}
            icon="bold"
            disabled={disabled}
          />
        )}
        {isVisible('italic') && (
          <MarkToolbarButton
            type="italic"
            nodeType={MARK_ITALIC}
            label={t('editor.editorWidgets.markdown.italic')}
            icon="italic"
            disabled={disabled}
          />
        )}
        {isVisible('code') && (
          <MarkToolbarButton
            type="code"
            nodeType={MARK_CODE}
            label={t('editor.editorWidgets.markdown.code')}
            icon="code"
            disabled={disabled}
          />
        )}
      </div>
    </ToolbarContainer>
  );
}

Toolbar.propTypes = {
  // onAddAsset: PropTypes.func.isRequired,
  // getAsset: PropTypes.func.isRequired,
  // onChange: PropTypes.func.isRequired,
  // onMode: PropTypes.func.isRequired,
  // className: PropTypes.string.isRequired,
  // value: PropTypes.string,
  // field: ImmutablePropTypes.map.isRequired,
  // getEditorComponents: PropTypes.func.isRequired,
  // getRemarkPlugins: PropTypes.func.isRequired,
  // isShowModeToggle: PropTypes.bool.isRequired,
  disabled: PropTypes.bool,
  t: PropTypes.func.isRequired,
};

export default Toolbar;
