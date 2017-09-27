import PropTypes from 'prop-types';
import React from 'react';
import { resolveWidget } from '../../../../Widgets';
import { prefixer } from '../../../../../lib/styleHelper';

const controlPaneStyles = prefixer('controlPane');

const ToolbarPluginFormControl = ({
  field,
  value,
  pluginData,
  onAddAsset,
  onRemoveAsset,
  getAsset,
  onChange,
}) => {
  const widget = resolveWidget(field.get('widget') || 'string');
  const key = `field-${ field.get('name') }`;
  const Control = widget.control;
  const controlProps = { field, value, onAddAsset, onRemoveAsset, getAsset, onChange };

  return (
    <div className={controlPaneStyles("control")} key={key}>
      <label className={controlPaneStyles("label")} htmlFor={key}>{field.get('label')}</label>
      <Control {...controlProps}/>
    </div>
  );
};

ToolbarPluginFormControl.propTypes = {
  field: PropTypes.object.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  onAddAsset: PropTypes.func.isRequired,
  onRemoveAsset: PropTypes.func.isRequired,
  getAsset: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default ToolbarPluginFormControl;
