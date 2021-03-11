import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { Icon, lengths, colors, zIndex } from 'netlify-cms-ui-default';

const CreateFolderContainer = styled.div`
  height: 37px;
  display: flex;
  align-items: center;
  position: relative;
  width: 400px;
`;

const CreateFolderInput = styled.input`
  background-color: #eff0f4;
  border-radius: ${lengths.borderRadius};

  font-size: 14px;
  padding: 10px 6px 10px 32px;
  width: 100%;
  position: relative;
  z-index: ${zIndex.zIndex1};

  &:focus {
    outline: none;
    box-shadow: inset 0 0 0 2px ${colors.active};
  }
`;

const CreateFolderIcon = styled(Icon)`
  position: absolute;
  top: 50%;
  left: 6px;
  z-index: ${zIndex.zIndex2};
  transform: translate(0, -50%);
`;

class MediaLibraryCreateFolder extends React.Component {
  constructor(props) {
    super(props);
    this.state = { value: '', icon: 'folder' };

    this.handleChange = this.handleChange.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  handleChange(event) {
    const { folders } = this.props;
    this.setState({
      value: event.target.value,
      folderExists: folders.find(folder => folder.name === event.target.value),
    });
  }

  handleKeyDown(event) {
    const { onKeyDown } = this.props;
    if (event.key === 'Enter' && !this.state.folderExists) {
      onKeyDown(this.state.value);
      this.setState({ value: '' });
    }
  }

  render() {
    const { placeholder } = this.props;
    return (
      <CreateFolderContainer>
        <CreateFolderIcon type={this.state.folderExists ? 'not-allowed' : 'folder'} size="small" />
        <CreateFolderInput
          value={this.state.value}
          onChange={this.handleChange}
          onKeyDown={this.handleKeyDown}
          placeholder={placeholder}
          disabled={this.state.disabled}
        />
      </CreateFolderContainer>
    );
  }
}

MediaLibraryCreateFolder.propTypes = {
  value: PropTypes.string,
  onKeyDown: PropTypes.func.isRequired,
  placeholder: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
};

export default MediaLibraryCreateFolder;
