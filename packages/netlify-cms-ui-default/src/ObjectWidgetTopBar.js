import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { css } from '@emotion/core';
import Icon from './Icon';
import { colors, buttons } from './styles';
import Dropdown, { StyledDropdownButton, DropdownItem } from './Dropdown';
import ImmutablePropTypes from 'react-immutable-proptypes';

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

class ObjectWidgetTopBar extends React.Component {
  static propTypes = {
    allowAdd: PropTypes.bool,
    types: ImmutablePropTypes.list,
    onAdd: PropTypes.func,
    onAddType: PropTypes.func,
    onCollapseToggle: PropTypes.func,
    collapsed: PropTypes.bool,
    heading: PropTypes.node,
    label: PropTypes.string,
  };

  renderAddUI() {
    if (!this.props.allowAdd) {
      return null;
    }
    if (this.props.types && this.props.types.size > 0) {
      return this.renderTypesDropdown(this.props.types);
    } else {
      return this.renderAddButton();
    }
  }

  renderTypesDropdown(types) {
    return (
      <Dropdown
        renderButton={() => (
          <StyledDropdownButton>Add {this.props.label} item</StyledDropdownButton>
        )}
      >
        {types.map((type, idx) => (
          <DropdownItem
            key={idx}
            label={type.get('label', type.get('name'))}
            onClick={() => this.props.onAddType(type.get('name'))}
          />
        ))}
      </Dropdown>
    );
  }

  renderAddButton() {
    return (
      <AddButton onClick={this.props.onAdd}>
        Add {this.props.label} <Icon type="add" size="xsmall" />
      </AddButton>
    );
  }

  render() {
    const { onCollapseToggle, collapsed, heading = null } = this.props;

    return (
      <TopBarContainer>
        <ExpandButtonContainer hasHeading={!!heading}>
          <ExpandButton onClick={onCollapseToggle} data-testid="expand-button">
            <Icon type="chevron" direction={collapsed ? 'right' : 'down'} size="small" />
          </ExpandButton>
          {heading}
        </ExpandButtonContainer>
        {this.renderAddUI()}
      </TopBarContainer>
    );
  }
}

export default ObjectWidgetTopBar;
