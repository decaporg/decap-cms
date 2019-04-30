import React from 'react';
import { Map } from 'immutable';

const WidgetAdapter = props => {
  const { resolveWidget, widgetConfig } = props;
  const controlComponent = resolveWidget(widgetConfig.get('widget')).control;
  const toData = value => widgetConfig.get('keys').mapEntries(([k, v]) => ([v, value.get(v)]));
  return (
    <div {...props.attributes}>
      <div onClick={e => e.stopPropagation()}>
        {React.createElement(controlComponent, {
          value: props.node.data,
          onChange: (value = Map()) => props.editor.setNodeByKey(props.node.key, { data: toData(value) }),
          field: widgetConfig,
          classNameWrapper: props.classNameWrapper,
        })}
      </div>
    </div>
  );
};

export default WidgetAdapter;
