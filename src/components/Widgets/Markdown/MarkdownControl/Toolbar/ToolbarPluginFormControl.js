import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from "react-immutable-proptypes";
import { resolveWidget } from '../../../../Widgets';
import styles from './ToolbarPluginFormControl.css';

const ToolbarPluginFormControl = ({
  field,
  value,
  pluginData,
  onAddAsset,
  onRemoveAsset,
  getAsset,
  onChange,
  mediaPaths,
  onOpenMediaLibrary,
}) => {
  const widget = resolveWidget(field.get('widget') || 'string');
  const key = `field-${ field.get('name') }`;
  const Control = widget.control;
  const controlProps = { field, value, onAddAsset, onRemoveAsset, getAsset, onChange, mediaPaths, onOpenMediaLibrary };

  return (
    <div className={styles.control} key={key}>
      <label className={styles.label} htmlFor={key}>{field.get('label')}</label>
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
  mediaPaths: ImmutablePropTypes.map.isRequired,
  onOpenMediaLibrary: PropTypes.func.isRequired,
};

export default ToolbarPluginFormControl;
