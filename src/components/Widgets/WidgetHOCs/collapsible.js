import React, { Component } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import FontIcon from 'react-toolbox/lib/font_icon';

const collapsible = WrappedComponent =>
  class extends Component {
    static propTypes = {
      field: ImmutablePropTypes.map.isRequired,
    };

    constructor(props) {
      super(props);
      this.state = { collapsed: this.props.field.getIn(['collapse', 'startCollapsed'], false) };
    }

    handleToggle = () => {
      this.setState(Object.assign({}, this.state, { collapsed: !this.state.collapsed }));
    }

    getSummary() {
      return "SUMMARY";
    }

    render() {
      if (this.props.field.get('collapse')) {
        return (<div>
           <button onClick={this.handleToggle}>
             <FontIcon value={this.state.collapsed ? 'expand_more' : 'expand_less'} />
           </button>
           {this.state.collapsed
             ? <div>SUMMARY</div>
             : <WrappedComponent {...this.props} />}
        </div>);
      }

      return <WrappedComponent {...this.props} />;
    }
  };

export default collapsible;
