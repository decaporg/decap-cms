import PropTypes from 'prop-types';
import React, { Component } from 'react';
import styled from '@emotion/styled';
import { colors, transitions } from 'decap-cms-ui-default';

const FormContainer = styled.div`
  padding: 16px;
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
    box-shadow: 0 0 0 2px rgba(70, 151, 218, 0.1);
  }

  &::placeholder {
    color: ${colors.controlLabel};
  }
`;

const FormActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
`;

const AddButton = styled.button`
  background-color: ${colors.active};
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all ${transitions.main};

  &:hover:not(:disabled) {
    background-color: ${colors.activeAccent};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CharCount = styled.span`
  font-size: 12px;
  color: ${props => props.warn ? colors.errorText : colors.controlLabel};
`;

const Hint = styled.p`
  font-size: 12px;
  color: ${colors.controlLabel};
  margin: 4px 0 0;
  font-style: italic;
`;

class AddNoteForm extends Component {
  static propTypes = {
    onAdd: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
  };

  state = {
    content: '',
    isFocused: false,
  };

  maxLength = 1000;

  handleContentChange = (e) => {
    const content = e.target.value;
    if (content.length <= this.maxLength) {
      this.setState({ content });
    }
  };

  handleSubmit = (e) => {
    e.preventDefault();
    const { content } = this.state;
    const trimmedContent = content.trim();

    if (trimmedContent) {
      this.props.onAdd(trimmedContent);
      this.setState({ content: '', isFocused: false });
    }
  };

  handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      this.handleSubmit(e);
    }
  };

  handleFocus = () => {
    this.setState({ isFocused: true });
  };

  handleBlur = () => {
    // Delay to allow button click to register
    setTimeout(() => {
      if (!this.state.content.trim()) {
        this.setState({ isFocused: false });
      }
    }, 150);
  };

  render() {
    const { t } = this.props;
    const { content } = this.state;
    const charCount = content.length;
    const canSubmit = content.trim().length > 0;
    const isNearLimit = charCount > this.maxLength * 0.8;

    return (
      <FormContainer>
        <form onSubmit={this.handleSubmit}>
          <TextArea
            value={content}
            onChange={this.handleContentChange}
            onKeyDown={this.handleKeyDown}
            onFocus={this.handleFocus}
            onBlur={this.handleBlur}
            placeholder={t('editor.editorNotesPane.addPlaceholder')}
            rows='4'
          />
              <FormActions>
                <CharCount warn={isNearLimit}>
                  {charCount}/{this.maxLength}
                </CharCount>
                <AddButton type="submit" disabled={!canSubmit}>
                  {t('editor.editorNotesPane.addNote')}
                </AddButton>
              </FormActions>
              <Hint>
                {t('editor.editorNotesPane.shortcut')}
              </Hint>
        </form>
      </FormContainer>
    );
  }
}

export default AddNoteForm;