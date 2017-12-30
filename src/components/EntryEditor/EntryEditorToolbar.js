import React, { PropTypes } from 'react';
import { Button } from 'react-toolbox/lib/button';
import i18n from '../../i18n';

const EntryEditorToolbar = (
  {
    isPersisting,
    onPersist,
    onCancelEdit,
  }) => {
  const disabled = isPersisting;
  return (
    <div>
      <Button
        primary
        raised
        onClick={onPersist}
        disabled={disabled}
      >
        { isPersisting ? i18n.t('saving') + ' ...' : i18n.t('save') }
      </Button>
      {' '}
      <Button onClick={onCancelEdit}>
        Cancel
      </Button>
    </div>
  );
};

EntryEditorToolbar.propTypes = {
  isPersisting: PropTypes.bool,
  onPersist: PropTypes.func.isRequired,
  onCancelEdit: PropTypes.func.isRequired,
};

export default EntryEditorToolbar;
