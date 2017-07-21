import React, { PropTypes } from 'react';
import { Button } from 'react-toolbox/lib/button';

const EntryEditorToolbar = (
  {
    isPersisting,
    onPersist,
    showDelete,
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
      { showDelete
        ? (<Button accent onClick={onDelete}>
            Delete
           </Button>)
        : '' }
      { showDelete ? ' ' : '' }
      <Button onClick={onCancelEdit}>
        Cancel
      </Button>
    </div>
  );
};

EntryEditorToolbar.propTypes = {
  isPersisting: PropTypes.bool,
  onPersist: PropTypes.func.isRequired,
  showDelete: PropTypes.bool.isRequired,
  onDelete: PropTypes.func.isRequired,
  onCancelEdit: PropTypes.func.isRequired,
};

export default EntryEditorToolbar;
