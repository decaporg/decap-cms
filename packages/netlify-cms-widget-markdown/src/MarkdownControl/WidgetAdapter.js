import React from 'react';
import { Map } from 'immutable';
import { ClassNames } from '@emotion/core';
import { lengths } from 'netlify-cms-ui-default';

const WidgetAdapter = props => {
  const { resolveWidget, widgetConfig, editorComponentType, classNameWrapper, value } = props;
  const controlComponent = resolveWidget(widgetConfig.get('widget')).control;
  return (
    <div {...props.attributes}>
      <div onClick={e => e.stopPropagation()}>
        <ClassNames>
          {({ css, cx }) =>
            React.createElement(controlComponent, {
              value,
              onChange: (newValue = Map()) =>
                props.editor.setNodeByKey(props.node.key, { data: newValue }),
              field: widgetConfig.set(editorComponentType, editorComponentType),
              classNameWrapper: cx(
                classNameWrapper,
                css`
                  border-top-left-radius: ${lengths.borderRadius};
                `,
              ),
            })
          }
        </ClassNames>
      </div>
    </div>
  );
};

export default WidgetAdapter;
