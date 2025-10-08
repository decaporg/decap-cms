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
    h1: t('editor.editorWidgets.headingOptions.headingOne'),
    h2: t('editor.editorWidgets.headingOptions.headingTwo'),
    h3: t('editor.editorWidgets.headingOptions.headingThree'),
    h4: t('editor.editorWidgets.headingOptions.headingFour'),
    h5: t('editor.editorWidgets.headingOptions.headingFive'),
    h6: t('editor.editorWidgets.headingOptions.headingSix'),
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

  function handleChange(optionKey) {
    unwrapList(editor);
    editor.tf.toggleBlock(optionKey);
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
                  isActive={!disabled && Object.keys(headingOptions).some(key => key == value)}
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
                      className={optionKey == value ? 'active' : ''}
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
