import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from '@emotion/styled';
import { colors, transitions } from 'decap-cms-ui-default';

const NoteCard = styled.div`
  background-color: ${props => (props.resolved ? colors.inputBackground : 'white')};
  border: 1px solid ${props => (props.resolved ? colors.textFieldBorder : colors.textFieldBorder)};
  border-radius: 4px;
  margin-bottom: 8px;
  padding: 12px;
  transition: all ${transitions.main};
  opacity: ${props => (props.resolved ? 0.7 : 1)};

  &:hover {
    border-color: ${colors.active};
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const NoteHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const NoteAuthor = styled.span`
  font-size: 12px;
  color: ${colors.controlLabel};
  font-weight: 500;
`;

const NoteTimestamp = styled.span`
  font-size: 11px;
  color: ${colors.controlLabel};
`;

const NoteContent = styled.div`
  margin-bottom: 8px;
`;

const NoteText = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
  color: ${colors.text};
  white-space: pre-wrap;
  word-wrap: break-word;
`;

const EditableText = styled.textarea`
  width: 100%;
  min-height: 60px;
  padding: 8px;
  border: 1px solid ${colors.active};
  border-radius: 3px;
  font-size: 14px;
  font-family: inherit;
  line-height: 1.4;
  resize: vertical;
  outline: none;

  &:focus {
    border-color: ${colors.active};
    box-shadow: 0 0 0 2px rgba(70, 151, 218, 0.1);
  }
`;

const NoteActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: ${colors.controlLabel};
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 3px;
  transition: all ${transitions.main};

  &:hover {
    background-color: ${colors.inputBackground};
    color: ${props => (props.danger ? colors.errorText : colors.active)};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ResolvedBadge = styled.span`
  background-color: ${colors.successText};
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 500;
  text-transform: uppercase;
`;

class NoteItem extends Component {
  static propTypes = {
    note: ImmutablePropTypes.map.isRequired,
    onUpdate: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onToggleResolution: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
  };

  state = {
    isEditing: false,
    editContent: '',
  };

  formatTimestamp = timestamp => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  handleEditStart = () => {
    this.setState({
      isEditing: true,
      editContent: this.props.note.get('content'),
    });
  };

  handleEditCancel = () => {
    this.setState({
      isEditing: false,
      editContent: '',
    });
  };

  handleEditSave = () => {
    const { note, onUpdate } = this.props;
    const { editContent } = this.state;
    const trimmedContent = editContent.trim();

    if (trimmedContent && trimmedContent !== note.get('content')) {
      onUpdate(note.get('id'), { content: trimmedContent });
    }

    this.setState({
      isEditing: false,
      editContent: '',
    });
  };

  handleEditKeyDown = e => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      this.handleEditSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this.handleEditCancel();
    }
  };

  handleDelete = () => {
    const { note, onDelete, t } = this.props;
    if (window.confirm(t('editor.editorNotesPane.confirmDelete'))) {
      onDelete(note.get('id'));
    }
  };

  handleToggleResolution = () => {
    const { note, onToggleResolution } = this.props;
    onToggleResolution(note.get('id'));
  };
  render() {
    const { note, t } = this.props;
    const { isEditing, editContent } = this.state;
    const resolved = note.get('resolved');

    return (
      <NoteCard resolved={resolved}>
        <NoteHeader>
          <NoteAuthor>{note.get('author')}</NoteAuthor>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {resolved && <ResolvedBadge>resolved</ResolvedBadge>}
            <NoteTimestamp>{this.formatTimestamp(note.get('timestamp'))}</NoteTimestamp>
          </div>
        </NoteHeader>

        <NoteContent>
          {isEditing ? (
            <EditableText
              value={editContent}
              onChange={e => this.setState({ editContent: e.target.value })}
              onKeyDown={this.handleEditKeyDown}
              placeholder={t('editor.editorNotesPane.editPlaceholder')}
              autoFocus
            />
          ) : (
            <NoteText>{note.get('content')}</NoteText>
          )}
        </NoteContent>

        <NoteActions>
          {isEditing ? (
            <>
              <ActionButton onClick={this.handleEditSave}>
                {t('editor.editorNotesPane.save')}
              </ActionButton>
              <ActionButton onClick={this.handleEditCancel}>
                {t('editor.editorNotesPane.cancel')}
              </ActionButton>
            </>
          ) : (
            <>
              {!resolved && (
                <ActionButton onClick={this.handleEditStart}>
                  {t('editor.editorNotesPane.edit')}
                </ActionButton>
              )}
              <ActionButton onClick={this.handleToggleResolution}>
                {resolved 
                  ? t('editor.editorNotesPane.unresolve') 
                  : t('editor.editorNotesPane.resolve')
                }
              </ActionButton>
              <ActionButton onClick={this.handleDelete} danger>
                {t('editor.editorNotesPane.delete')}
              </ActionButton>
            </>
          )}
        </NoteActions>
      </NoteCard>
    );
  }
}

export default NoteItem;
