import React from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'react-emotion';
import Icon from './Icon';
import { colors, buttons } from './styles';

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

const ObjectWidgetTopBar = ({
  allowAdd,
  onAdd,
  onCollapseToggle,
  collapsed,
  heading = null,
  label,
}) => (
  <TopBarContainer>
    <ExpandButtonContainer hasHeading={!!heading}>
      <ExpandButton onClick={onCollapseToggle}>
        <Icon type="chevron" direction={collapsed ? 'right' : 'down'} size="small" />
      </ExpandButton>
      {heading}
    </ExpandButtonContainer>
    {!allowAdd ? null : (
      <AddButton onClick={onAdd}>
        Add {label} <Icon type="add" size="xsmall" />
      </AddButton>
    )}
  </TopBarContainer>
);

ObjectWidgetTopBar.propTypes = {
  allowAdd: PropTypes.bool,
  onAdd: PropTypes.func,
  onCollapseToggle: PropTypes.func,
  collapsed: PropTypes.bool,
  heading: PropTypes.node,
  label: PropTypes.string,
};

export default ObjectWidgetTopBar;
