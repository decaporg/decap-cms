import React, { PropTypes } from 'react';
import { Button } from 'react-toolbox/lib/button';
import { __ } from '../../i18n';

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
        { isPersisting ? __('Saving...') : __('Save') }
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
