import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { unwrapList } from '@platejs/list-classic';
import { Dropdown, DropdownButton, DropdownItem } from 'decap-cms-ui-default';
import { ParagraphPlugin, useEditorRef, useEditorSelector } from 'platejs/react';

import ToolbarButton from './ToolbarButton';

const ToolbarDropdownWrapper = styled.div`
  display: inline-block;
  position: relative;
`;

function HeadingToolbarButton({ disabled, isVisible, t }) {
  const headingOptions = {
    'heading-one': t('editor.editorWidgets.headingOptions.headingOne'),
    'heading-two': t('editor.editorWidgets.headingOptions.headingTwo'),
    'heading-three': t('editor.editorWidgets.headingOptions.headingThree'),
    'heading-four': t('editor.editorWidgets.headingOptions.headingFour'),
    'heading-five': t('editor.editorWidgets.headingOptions.headingFive'),
    'heading-six': t('editor.editorWidgets.headingOptions.headingSix'),
  };

  // Map schema button names to Plate block types
  const buttonToBlockType = {
    'heading-one': 'h1',
    'heading-two': 'h2',
    'heading-three': 'h3',
    'heading-four': 'h4',
    'heading-five': 'h5',
    'heading-six': 'h6',
  };

  const blockTypeToButton = {
    h1: 'heading-one',
    h2: 'heading-two',
    h3: 'heading-three',
    h4: 'heading-four',
    h5: 'heading-five',
    h6: 'heading-six',
  };

  const editor = useEditorRef();

  const value = useEditorSelector(editor => {
    if (!editor.api.isExpanded()) {
      const entry = editor.api.block();

      if (entry) {
        return entry[0].type;
      }
    }

    return ParagraphPlugin.key;
  }, []);

  function handleChange(buttonName) {
    const blockType = buttonToBlockType[buttonName];
    unwrapList(editor);
    editor.tf.toggleBlock(blockType);
    editor.tf.focus();
  }

  return (
    <>
      {Object.keys(headingOptions).some(isVisible) && (
        <ToolbarDropdownWrapper>
          <Dropdown
            dropdownWidth="max-content"
            dropdownTopOverlap="36px"
            renderButton={() => (
              <DropdownButton>
                <ToolbarButton
                  type="headings"
                  label={t('editor.editorWidgets.markdown.headings')}
                  icon="hOptions"
                  disabled={disabled}
                  isActive={!disabled && blockTypeToButton[value] !== undefined}
                />
              </DropdownButton>
            )}
          >
            {!disabled &&
              Object.keys(headingOptions).map(
                (optionKey, idx) =>
                  isVisible(optionKey) && (
                    <DropdownItem
                      key={idx}
                      label={headingOptions[optionKey]}
                      className={blockTypeToButton[value] === optionKey ? 'active' : ''}
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => handleChange(optionKey)}
                    />
                  ),
              )}
          </Dropdown>
        </ToolbarDropdownWrapper>
      )}
    </>
  );
}

HeadingToolbarButton.propTypes = {
  isVisible: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  t: PropTypes.func.isRequired,
};

export default HeadingToolbarButton;
