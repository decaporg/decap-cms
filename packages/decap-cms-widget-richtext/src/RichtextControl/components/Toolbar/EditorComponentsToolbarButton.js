import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { Dropdown, DropdownButton, DropdownItem } from 'decap-cms-ui-default';
import { List } from 'immutable';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { insertElements, isSelectionAtBlockEnd, isSelectionAtBlockStart, setBlockAboveNode } from '@udecode/plate-common';
import { useEditorRef } from '@udecode/plate-common/react';

import ToolbarButton from './ToolbarButton';

const ToolbarDropdownWrapper = styled.div`
  display: inline-block;
  position: relative;
`;

function EditorComponentsToolbarButton({ disabled, editorComponents, allowedEditorComponents, t }) {
  const editor = useEditorRef();


  const handleChange = useCallback(
    plugin => {

      const defaultValues = plugin.fields
        .toMap()
        .mapKeys((_, field) => field.get('name'))
        .filter(field => field.has('default'))
        .map(field => field.get('default'));

      if (isSelectionAtBlockEnd(editor) && isSelectionAtBlockStart(editor)) {
        setBlockAboveNode(editor, {
          children: [{ text: '' }],
          type: 'shortcode',
          id: plugin.id,
          data: {
            shortcode: plugin.id,
            shortcodeNew: true,
            shortcodeData: defaultValues.toJS(),
          },
        })
        return;
      }

      insertElements(editor, {
        children: [{ text: '' }],
        type: 'shortcode',
        id: plugin.id,
        data: {
          shortcode: plugin.id,
          shortcodeNew: true,
          shortcodeData: defaultValues.toJS(),
        },
      });
    },
    [editor],
  );

  const editorComponentOptions = editorComponents
    ? editorComponents
        .toList()
        .filter(({ id }) => (allowedEditorComponents ? allowedEditorComponents.includes(id) : true))
    : List();

  const showEditorComponents = editorComponentOptions.size >= 1;

  return (
    <>
      {showEditorComponents && (
        <ToolbarDropdownWrapper>
          <Dropdown
            dropdownWidth="max-content"
            dropdownTopOverlap="36px"
            renderButton={() => (
              <DropdownButton>
                <ToolbarButton
                  type="headings"
                  label={t('editor.editorWidgets.markdown.addComponent')}
                  icon="add-with"
                  disabled={disabled}
                  isActive={false}
                />
              </DropdownButton>
            )}
          >
            {!disabled &&
              editorComponentOptions.map(option => (
                <DropdownItem
                  key={option.id}
                  label={option.label}
                  className={''}
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => handleChange(option)}
                />
              ))}
          </Dropdown>
        </ToolbarDropdownWrapper>
      )}
    </>
  );
}

EditorComponentsToolbarButton.propTypes = {
  editorComponents: ImmutablePropTypes.map,
  allowedEditorComponents: ImmutablePropTypes.list,
  disabled: PropTypes.bool,
  t: PropTypes.func.isRequired,
};

export default EditorComponentsToolbarButton;
