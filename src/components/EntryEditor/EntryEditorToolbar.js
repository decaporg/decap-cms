import React, { PropTypes } from 'react';
import { Button } from 'react-toolbox/lib/button';

const EntryEditorToolbar = (
  {
    isPersisting,
    onPersist,
    onDelete,
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
        { isPersisting ? 'Saving...' : 'Save' }
      </Button>
      {' '}
      <Button onClick={onCancelEdit}>
        Cancel
      </Button>
      <Button
        accent
        onClick={onDelete}
      >
        Delete
      </Button>
    </div>
  );
};

EntryEditorToolbar.propTypes = {
  isPersisting: PropTypes.bool,
  onPersist: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onCancelEdit: PropTypes.func.isRequired,
};

export default EntryEditorToolbar;
