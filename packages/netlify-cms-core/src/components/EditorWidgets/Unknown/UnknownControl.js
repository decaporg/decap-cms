import React from 'react';
import { translate } from 'react-polyglot';
import ImmutablePropTypes from 'react-immutable-proptypes';

const UnknownControl = ({ field, t }) => {
  return (
    <div>{t('editor.editorWidgets.unknownControl.noControl', { widget: field.get('widget') })}</div>
  );
};

UnknownControl.propTypes = {
  field: ImmutablePropTypes.map,
  t: ImmutablePropTypes.func.isRequired,
};

export default translate()(UnknownControl);
