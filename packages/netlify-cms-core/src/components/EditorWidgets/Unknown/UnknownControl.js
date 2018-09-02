import React from 'react';
import { translate } from 'react-polyglot';
import ImmutablePropTypes from 'react-immutable-proptypes';
import PropTypes from 'prop-types';

const UnknownControl = ({ field, t }) => {
  return (
    <div>{t('editor.editorWidgets.unknownControl.noControl', { widget: field.get('widget') })}</div>
  );
};

UnknownControl.propTypes = {
  field: ImmutablePropTypes.map,
  t: PropTypes.func.isRequired,
};

export default translate()(UnknownControl);
