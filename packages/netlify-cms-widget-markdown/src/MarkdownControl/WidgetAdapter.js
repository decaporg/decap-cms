import React from 'react';
import { Map } from 'immutable';

const WidgetAdapter = props => {
  const { resolveWidget, widgetConfig, editorComponentType, classNameWrapper } = props;
  const controlComponent = resolveWidget(widgetConfig.get('widget')).control;
  return (
    <div {...props.attributes}>
      <div onClick={e => e.stopPropagation()}>
        {React.createElement(controlComponent, {
          value: props.node.data,
          onChange: (value = Map()) => props.editor.setNodeByKey(props.node.key, { data: value }),
          field: widgetConfig.set(editorComponentType, editorComponentType),
          classNameWrapper,
        })}
      </div>
    </div>
  );
};

export default WidgetAdapter;
