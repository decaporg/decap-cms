import React, { PropTypes } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { markdownToHtml, htmlToMarkdown } from '../../unified';
import Toolbar from '../Toolbar/Toolbar';
import { Sticky } from '../../../../UI/Sticky/Sticky';
import styles from './index.css';

export default class RawEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: htmlToMarkdown(this.props.value) || '',
    };
  }

  handleChange = (e) => {
    const html = markdownToHtml(e.target.value);
    this.props.onChange(html);
    this.setState({ value: e.target.value });
  };

  handleToggleMode = () => {
    this.props.onMode('visual');
  };

  render() {
    return (
      <div className={styles.root}>
        <Sticky
          className={styles.editorControlBar}
          classNameActive={styles.editorControlBarSticky}
          fillContainerWidth
        >
          <Toolbar onToggleMode={this.handleToggleMode} disabled rawMode />
        </Sticky>
        <TextareaAutosize
          className={styles.textarea}
          value={this.state.value}
          onChange={this.handleChange}
        />
      </div>
    );
  }
}

RawEditor.propTypes = {
  onChange: PropTypes.func.isRequired,
  onMode: PropTypes.func.isRequired,
  value: PropTypes.node,
};
