import React from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'react-emotion';
import Icon from './Icon';
import { colors, buttons } from './styles';
import ImmutablePropTypes from "react-immutable-proptypes";

const TopBarContainer = styled.div`
  align-items: center;
  background-color: ${colors.textFieldBorder};
  display: flex;
  justify-content: space-between;
  margin: 0 -14px;
  padding: 13px;
`;

const ExpandButtonContainer = styled.div`
  ${props =>
    props.hasHeading &&
    css`
      display: flex;
      align-items: center;
      font-size: 14px;
      font-weight: 500;
      line-height: 1;
    `};
`;

const ExpandButton = styled.button`
  ${buttons.button};
  padding: 4px;
  background-color: transparent;
  color: inherit;

  &:last-of-type {
    margin-right: 4px;
  }
`;

const AddButton = styled.button`
  ${buttons.button};
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2px 12px;
  font-size: 12px;
  font-weight: bold;
  border-radius: 3px;

  ${Icon} {
    margin-left: 6px;
  }
`;

const AddItem = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

class ObjectWidgetTopBar extends React.Component {
  static propTypes = {
    allowAdd: PropTypes.bool,
    widgets: ImmutablePropTypes.list,
    onAdd: PropTypes.func,
    onCollapseToggle: PropTypes.func,
    collapsed: PropTypes.bool,
    heading: PropTypes.node,
    label: PropTypes.string,
  };

  constructor(props) {
    super(props);

    this.state = {widget: !this.props.widgets || this.props.widgets.size === 0 ? null : this.props.widgets.get(0).get('name')};
  }

  handleWidgetChange = (event) => {
    this.setState({widget: event.target.value});
  };

  handleAdd = (e) => {
    if (this.state.widget) {
      this.props.onAdd(e, this.state.widget);
    } else {
      this.props.onAdd(e);
    }
  };

  addItemUI() {
    if (!this.props.allowAdd) {
      return null;
    }
    const widgets = this.props.widgets;
    const addButton = (
      <AddButton onClick={this.handleAdd}>
        Add {this.props.label} <Icon type="add" size="xsmall" />
      </AddButton>
    );

    if (widgets && widgets.size > 0) {
      return (
        <AddItem>
          <select value={this.state.widget} style={{marginRight: 10}} onChange={this.handleWidgetChange}>
            {widgets.map((widget, idx) => <option key={idx} value={widget.get('name')}>{widget.get('label', widget.get('name'))}</option>)}
          </select>
          {addButton}
        </AddItem>
      );
    } else {
      return addButton;
    }
  }

  render() {
    const {
      onCollapseToggle,
      collapsed,
      heading = null,
    } = this.props;

    return (
      <TopBarContainer>
        <ExpandButtonContainer hasHeading={!!heading}>
          <ExpandButton onClick={onCollapseToggle}>
            <Icon type="chevron" direction={collapsed ? 'right' : 'down'} size="small" />
          </ExpandButton>
          {heading}
        </ExpandButtonContainer>
        {this.addItemUI()}
      </TopBarContainer>
    );
  }
}

export default ObjectWidgetTopBar;
