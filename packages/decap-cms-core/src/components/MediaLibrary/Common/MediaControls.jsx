import React from 'react';
import { ButtonGroup, Button } from 'decap-cms-ui-next';

function MediaControls({
  onSelect,
  hasSelection,
  selectedButtonLabel,
  onDelete,
  deleteEnabled,
  deleteButtonLabel,
}) {
  return (
    <ButtonGroup>
      <Button type="danger" onClick={onDelete} disabled={!deleteEnabled} icon="trash-2">
        {deleteButtonLabel}
      </Button>

      <Button type="success" primary onClick={onSelect} disabled={!hasSelection} icon="check">
        {selectedButtonLabel}
      </Button>
    </ButtonGroup>
  );
}

export default MediaControls;
