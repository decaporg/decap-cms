import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { List } from 'immutable';
import { colors, transitions, Toggle } from 'decap-cms-ui-default';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { BoldPlugin, CodePlugin, ItalicPlugin } from '@platejs/basic-nodes/react';
import { css } from '@emotion/react';

import MarkToolbarButton from './MarkToolbarButton';
import HeadingToolbarButton from './HeadingToolbarButton';
import ListToolbarButton from './ListToolbarButton';
import LinkToolbarButton from './LinkToolbarButton';
import BlockquoteToolbarButton from './BlockquoteToolbarButton';
import EditorComponentsToolbarButton from './EditorComponentsToolbarButton';

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

const ToolbarToggle = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  font-size: 14px;
  margin: 0 10px;
`;

const StyledToggle = ToolbarToggle.withComponent(Toggle);

const ToolbarToggleLabel = styled.span`
  display: inline-block;
  text-align: center;
  white-space: nowrap;
  line-height: 20px;
  min-width: ${props => (props.offPosition ? '62px' : '70px')};

  ${props =>
    props.isActive &&
    css`
      font-weight: 600;
      color: ${colors.active};
    `};
`;

function Toolbar(props) {
  const {
    disabled,
    t,
    rawMode,
    onToggleMode,
    isShowModeToggle,
    editorComponents,
    allowedEditorComponents,
  } = props;

  function isVisible(button) {
    const { buttons } = props;
    return !List.isList(buttons) || buttons.includes(button);
  }

  return (
    <ToolbarContainer>
      <div style={{ background: colors.foreground }}>
        {isVisible('bold') && (
          <MarkToolbarButton
            type="bold"
            nodeType={BoldPlugin.key}
            label={t('editor.editorWidgets.markdown.bold')}
            icon="bold"
            disabled={disabled}
          />
        )}
        {isVisible('italic') && (
          <MarkToolbarButton
            type="italic"
            nodeType={ItalicPlugin.key}
            label={t('editor.editorWidgets.markdown.italic')}
            icon="italic"
            disabled={disabled}
          />
        )}
        {isVisible('code') && (
          <MarkToolbarButton
            type="code"
            nodeType={CodePlugin.key}
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
        {isVisible('blockquote') && (
          <BlockquoteToolbarButton
            type="quote"
            label={t('editor.editorWidgets.markdown.quote')}
            icon="quote"
            disabled={disabled}
          />
        )}
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
        <EditorComponentsToolbarButton
          isVisible={isVisible}
          disabled={disabled}
          t={t}
          editorComponents={editorComponents}
          allowedEditorComponents={allowedEditorComponents}
        />
      </div>
      {isShowModeToggle && (
        <ToolbarToggle>
          <ToolbarToggleLabel isActive={!rawMode} offPosition>
            {t('editor.editorWidgets.markdown.richText')}
          </ToolbarToggleLabel>
          <StyledToggle active={rawMode} onChange={onToggleMode} />
          <ToolbarToggleLabel isActive={rawMode}>
            {t('editor.editorWidgets.markdown.markdown')}
          </ToolbarToggleLabel>
        </ToolbarToggle>
      )}
    </ToolbarContainer>
  );
}

Toolbar.propTypes = {
  buttons: PropTypes.array,
  disabled: PropTypes.bool,
  onToggleMode: PropTypes.func.isRequired,
  rawMode: PropTypes.bool,
  isShowModeToggle: PropTypes.bool,
  editorComponents: ImmutablePropTypes.map,
  allowedEditorComponents: ImmutablePropTypes.list,
  t: PropTypes.func.isRequired,
};

export default Toolbar;
