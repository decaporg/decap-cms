import styled from '@emotion/styled';
import React, { useState } from 'react';

import { colors, transitions } from '@/ui/default/index';

import type { TranslateFunction } from '@/ui/default/index';

const FormContainer = styled.div`
  padding: 16px 28px;
  border-top: 1px solid ${colors.textFieldBorder};
  background-color: ${colors.inputBackground};
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: 12px;
  border: 1px solid ${colors.textFieldBorder};
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  line-height: 1.4;
  resize: vertical;
  outline: none;
  transition: border-color ${transitions.main};

  &:focus {
    border-color: ${colors.active};
    box-shadow: 0 0 0 2px ${colors.activeBackground};
  }

  &::placeholder {
    color: ${colors.controlLabel};
  }
`;

const FormActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
`;

const AddButton = styled.button`
  background-color: ${colors.active};
  color: ${colors.textLight};
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all ${transitions.main};

  &:hover:not(:disabled) {
    background-color: ${colors.statusReadyText};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Hint = styled.p`
  font-size: 12px;
  color: ${colors.controlLabel};
  margin: 0;
  font-style: italic;
`;

interface AddNoteFormProps {
  onAdd: (content: string) => void;
  t: TranslateFunction;
}

export default function AddNoteForm({ onAdd, t }: AddNoteFormProps) {
  const [content, setContent] = useState('');
  const canSubmit = content.trim().length > 0;

  function submit() {
    const trimmed = content.trim();
    if (trimmed) {
      onAdd(trimmed);
      setContent('');
    }
  }

  return (
    <FormContainer>
      <form
        onSubmit={event => {
          event.preventDefault();
          submit();
        }}
      >
        <TextArea
          value={content}
          onChange={event => setContent(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
              event.preventDefault();
              submit();
            }
          }}
          placeholder={t('editor.editorNotesPane.addPlaceholder')}
          aria-label={t('editor.editorNotesPane.addPlaceholder')}
          rows={4}
        />
        <FormActions>
          <Hint>{t('editor.editorNotesPane.shortcut')}</Hint>
          <AddButton type="submit" disabled={!canSubmit}>
            {t('editor.editorNotesPane.addNote')}
          </AddButton>
        </FormActions>
      </form>
    </FormContainer>
  );
}
