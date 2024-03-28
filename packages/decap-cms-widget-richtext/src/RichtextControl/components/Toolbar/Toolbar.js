import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { List } from 'immutable';
import { colors, transitions } from 'decap-cms-ui-default';
import { MARK_BOLD, MARK_CODE, MARK_ITALIC } from '@udecode/plate-basic-marks';

import MarkToolbarButton from './MarkToolbarButton';
import HeadingToolbarButton from './HeadingToolbarButton';
import ListToolbarButton from './ListToolbarButton';
import LinkToolbarButton from './LinkToolbarButton';

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
        <LinkToolbarButton
          type="link"
          label={t('editor.editorWidgets.markdown.link')}
          icon="link"
          disabled={disabled}
          t={t}
        />
        <HeadingToolbarButton isVisible={isVisible} disabled={disabled} t={t} />
        <ListToolbarButton
          type="ul"
          label={t('editor.editorWidgets.markdown.bulletedList')}
          icon="list-bulleted"
          disabled={disabled}
        />
        <ListToolbarButton
          type="ol"
          label={t('editor.editorWidgets.markdown.numberedList')}
          icon="list-numbered"
          disabled={disabled}
        />
      </div>
    </ToolbarContainer>
  );
}

Toolbar.propTypes = {
  buttons: PropTypes.array,
  disabled: PropTypes.bool,
  t: PropTypes.func.isRequired,
};

export default Toolbar;
