/* eslint-disable react/prop-types */
import { css } from '@emotion/react';
import { useSelected, ReactEditor, useSlate } from 'slate-react';
import { Transforms } from 'slate';
import { colors, lengths } from 'decap-cms-ui-default';

import { getEditorComponents } from '../index';

function InlineShortcode(props) {
  const { attributes, children, element } = props;
  const editor = useSlate();
  const isSelected = useSelected();
  const plugin = getEditorComponents().get(element.data?.shortcode);
  const isVoid = element.data?.isVoid !== false;
  const shortcodeData = element.data?.shortcodeData || {};

  async function handleClick(e) {
    if (plugin && typeof plugin.onEdit === 'function') {
      e.preventDefault();
      e.stopPropagation();
      try {
        const updatedData = await plugin.onEdit({ data: shortcodeData });
        if (updatedData) {
          const path = ReactEditor.findPath(editor, element);
          Transforms.setNodes(
            editor,
            {
              data: {
                ...element.data,
                shortcodeData: updatedData,
              },
            },
            { at: path },
          );
        }
      } catch (err) {
        console.error(
          `Error executing onEdit for inline component '${element.data?.shortcode}':`,
          err,
        );
      }
    }
  }

  let previewContent;
  if (plugin && typeof plugin.toPreview === 'function') {
    previewContent = plugin.toPreview(shortcodeData);
  } else if (plugin && typeof plugin.toInline === 'function') {
    previewContent = plugin.toInline(shortcodeData);
  } else {
    previewContent = `[${element.data?.shortcode || 'inline'}]`;
  }

  const inlineStyles = css`
    display: inline-flex;
    align-items: center;
    vertical-align: baseline;
    cursor: ${plugin?.onEdit ? 'pointer' : 'default'};
    border-radius: ${lengths.borderRadius || '3px'};
    padding: 0 2px;
    background-color: ${isSelected ? 'rgba(30, 144, 255, 0.15)' : 'transparent'};
    box-shadow: ${isSelected ? `0 0 0 1px ${colors.active || '#3a69c7'}` : 'none'};
  `;

  return (
    <span {...attributes} css={inlineStyles} onClick={handleClick}>
      <span contentEditable={isVoid ? false : undefined} style={{ userSelect: 'none' }}>
        {previewContent}
      </span>
      {children}
    </span>
  );
}

export default InlineShortcode;
