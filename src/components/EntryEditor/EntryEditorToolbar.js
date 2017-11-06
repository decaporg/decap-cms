import PropTypes from 'prop-types';
import React from 'react';
import { Button } from 'react-toolbox/lib/button';

const EntryEditorToolbar = (
  {
    isPersisting,
    onPersist,
    enableSave,
    showDelete,
    onDelete,
    onCancelEdit,
  }) => {
  const disabled = !enableSave || isPersisting;
  return (
    <div className="nc-entryEditor-toolbar">
      <div onClick={onCancelEdit} className="nc-entryEditor-toolbar-backSection">
        <div className="nc-entryEditor-toolbar-backArrow">←</div>
        <div>
          <div className="nc-entryEditor-toolbar-backCollection">Writing in Posts collection</div>
          <div className="nc-entryEditor-toolbar-backStatus">Changes saved &#10003;</div>
        </div>
      </div>
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
    </div>
  );
};

EntryEditorToolbar.propTypes = {
  isPersisting: PropTypes.bool,
  onPersist: PropTypes.func.isRequired,
  enableSave: PropTypes.bool.isRequired,
  showDelete: PropTypes.bool.isRequired,
  onDelete: PropTypes.func.isRequired,
  onCancelEdit: PropTypes.func.isRequired,
};

export default EntryEditorToolbar;
