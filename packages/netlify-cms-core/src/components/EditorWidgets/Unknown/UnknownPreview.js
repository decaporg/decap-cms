import React from 'react';
import { translate } from 'react-polyglot';
import ImmutablePropTypes from 'react-immutable-proptypes';
import PropTypes from 'prop-types';

const UnknownPreview = ({ field, t }) => {
  return (
    <div className="nc-widgetPreview">
      {t('editor.editorWidgets.unknownPreview.noPreview', { widget: field.get('widget') })}
    </div>
  );
};

UnknownPreview.propTypes = {
  field: ImmutablePropTypes.map,
  t: PropTypes.func.isRequired,
};

export default translate()(UnknownPreview);
