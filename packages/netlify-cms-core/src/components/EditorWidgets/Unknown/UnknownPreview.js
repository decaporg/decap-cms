import React from 'react';
import { translate } from 'react-polyglot';
import ImmutablePropTypes from 'react-immutable-proptypes';

const UnknownPreview = ({ field, t }) => {
  return (
    <div className="nc-widgetPreview">
      {t('editor.editorWidgets.unknownPreview.noPreview', field.get('widget'))}
    </div>
  );
};

UnknownPreview.propTypes = {
  field: ImmutablePropTypes.map,
  t: ImmutablePropTypes.func.isRequired,
};

export default translate()(UnknownPreview);
