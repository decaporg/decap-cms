import React, { Component, PropTypes } from 'react';
import { fromJS } from 'immutable';
import { Button } from 'react-toolbox/lib/button';
import { resolveWidget } from '../../Widgets';
import styles from './BlockMenu.css';

export default class BlockMenu extends Component {
  static propTypes = {
    isOpen: PropTypes.bool,
    selectionPosition: PropTypes.object,
    plugins: PropTypes.object.isRequired,
    onBlock: PropTypes.func.isRequired,
    onAddAsset: PropTypes.func.isRequired,
    onRemoveAsset: PropTypes.func.isRequired,
    getAsset: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      isExpanded: false,
      openPlugin: null,
      pluginData: fromJS({}),
    };
  }

  componentDidUpdate() {
    const { selectionPosition } = this.props;
    if (selectionPosition) {
      const style = this.element.style;
      style.setProperty('top', `${ selectionPosition.top }px`);
    }
  }

  handleToggle = (e) => {
    e.preventDefault();
    this.setState({ isExpanded: !this.state.isExpanded });
  };

  handleRef = (ref) => {
    this.element = ref;
  };

  handlePlugin(plugin) {
    return (e) => {
      e.preventDefault();
      this.setState({ openPlugin: plugin, pluginData: fromJS({}) });
    };
  }

  buttonFor(plugin) {
    return (<li key={`plugin-${ plugin.get('id') }`}>
      <button onClick={this.handlePlugin(plugin)}>{plugin.get('label')}</button>
    </li>);
  }

  handleSubmit = (e) => {
    e.preventDefault();
    const { openPlugin, pluginData } = this.state;
    this.props.onBlock(openPlugin, pluginData);
    this.setState({ openPlugin: null, isExpanded: false });
  };

  handleCancel = (e) => {
    e.preventDefault();
    this.setState({ openPlugin: null, isExpanded: false });
  };

  controlFor(field) {
    const { onAddAsset, onRemoveAsset, getAsset } = this.props;
    const { pluginData } = this.state;
    const widget = resolveWidget(field.get('widget') || 'string');
    const value = pluginData.get(field.get('name'));

    return (
      <div className={styles.control} key={`field-${ field.get('name') }`}>
        <label className={styles.label}>{field.get('label')}</label>
        {
          React.createElement(widget.control, {
            field,
            value,
            onChange: (val) => {
              this.setState({
                pluginData: pluginData.set(field.get('name'), val),
              });
            },
            onAddAsset,
            onRemoveAsset,
            getAsset,
          })
        }
      </div>
    );
  }

  pluginForm(plugin) {
    return (<form className={styles.pluginForm} onSubmit={this.handleSubmit}>
      <h3>Insert {plugin.get('label')}</h3>
      {plugin.get('fields').map(field => this.controlFor(field))}
      <div className={styles.footer}>
        <Button
          raised
          onClick={this.handleSubmit}
        >
          Insert
        </Button>
        {' '}
        <Button onClick={this.handleCancel}>
          Cancel
        </Button>
      </div>
    </form>);
  }

  render() {
    const { isOpen, plugins } = this.props;
    const { isExpanded, openPlugin } = this.state;
    const classNames = [styles.root];
    if (isOpen) {
      classNames.push(styles.visible);
    }
    if (openPlugin) {
      classNames.push(styles.openPlugin);
    }

    return (<div className={classNames.join(' ')} ref={this.handleRef}>
      <button className={styles.button} onClick={this.handleToggle}>+</button>
      <ul className={[styles.menu, isExpanded && !openPlugin ? styles.expanded : styles.collapsed].join(' ')}>
        {plugins.map(plugin => this.buttonFor(plugin))}
      </ul>
      {openPlugin && this.pluginForm(openPlugin)}
    </div>);
  }
}
