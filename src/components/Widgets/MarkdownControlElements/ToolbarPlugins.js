import React, { Component, PropTypes } from 'react';
import { fromJS } from 'immutable';
import { Button } from 'react-toolbox/lib/button';
import { Icon } from '../../UI';
import { resolveWidget } from '../../Widgets';
import toolbarStyles from './Toolbar.css';
import styles from './ToolbarPlugins.css';

export default class ToolbarPlugins extends Component {
  static propTypes = {
    plugins: PropTypes.object.isRequired,
    onPlugin: PropTypes.func.isRequired,
    onAddAsset: PropTypes.func.isRequired,
    onRemoveAsset: PropTypes.func.isRequired,
    getAsset: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      openPlugin: null,
      pluginData: fromJS({}),
    };
  }

  handlePlugin(plugin) {
    return (e) => {
      e.preventDefault();
      this.setState({ openPlugin: plugin, pluginData: fromJS({}) });
    };
  }

  buttonFor(plugin) {
    return (<li key={`plugin-${ plugin.get('id') }`} className={toolbarStyles.Button}>
      <button className={styles[plugin.get('label')]} onClick={this.handlePlugin(plugin)} title={plugin.get('label')}>
        <Icon type={plugin.get('icon')} />
      </button>
    </li>);
  }

  handleSubmit = (e) => {
    e.preventDefault();
    const { openPlugin, pluginData } = this.state;
    this.props.onPlugin(openPlugin, pluginData);
    this.setState({ openPlugin: null });
  };

  handleCancel = (e) => {
    e.preventDefault();
    this.setState({ openPlugin: null });
  };

  controlFor(field) {
    const { onAddAsset, onRemoveAsset, getAsset } = this.props;
    const { pluginData } = this.state;
    const widget = resolveWidget(field.get('widget') || 'string');
    const value = pluginData.get(field.get('name'));
    const key = `field-${ field.get('name') }`;

    return (
      <div className={styles.control} key={key}>
        <label className={styles.label} htmlFor={key}>{field.get('label')}</label>
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
      <h3 className={styles.header}>Insert {plugin.get('label')}</h3>
      <div className={styles.body}>
        {plugin.get('fields').map(field => this.controlFor(field))}
      </div>
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
    const { plugins } = this.props;
    const { openPlugin } = this.state;
    const classNames = [styles.root];

    if (openPlugin) {
      classNames.push(styles.openPlugin);
    }

    return (<div className={classNames.join(' ')}>
      <ul className={styles.menu}>
        {plugins.map(plugin => this.buttonFor(plugin))}
      </ul>
      {openPlugin && this.pluginForm(openPlugin)}
    </div>);
  }
}
