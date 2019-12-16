import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from '@emotion/styled';
import { css } from '@emotion/core';
import { List } from 'immutable';
import {
  Toggle,
  Dropdown,
  DropdownItem,
  DropdownButton,
  colors,
  transitions,
  lengths,
} from 'netlify-cms-ui-default';
import ToolbarButton from './ToolbarButton';

const ToolbarContainer = styled.div`
  background-color: ${colors.textFieldBorder};
  border-top-right-radius: ${lengths.borderRadius};
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 11px 14px;
  min-height: 58px;
  transition: background-color ${transitions.main}, color ${transitions.main};
  color: ${colors.text};
`;

const ToolbarDropdownWrapper = styled.div`
  display: inline-block;
  position: relative;
`;

const ToolbarToggle = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  font-size: 14px;
  margin: 0 10px;
`;

const StyledToggle = ToolbarToggle.withComponent(Toggle);

const ToolbarToggleLabel = styled.span`
  display: inline-block;
  text-align: center;
  white-space: nowrap;
  line-height: 20px;
  width: ${props => (props.offPosition ? '62px' : '70px')};

  ${props =>
    props.isActive &&
    css`
      font-weight: 600;
      color: ${colors.active};
    `};
`;

const headingOptions = {
  'heading-one': 'Heading 1',
  'heading-two': 'Heading 2',
  'heading-three': 'Heading 3',
  'heading-four': 'Heading 4',
  'heading-five': 'Heading 5',
  'heading-six': 'Heading 6',
};

export default class Toolbar extends React.Component {
  static propTypes = {
    buttons: ImmutablePropTypes.list,
    onToggleMode: PropTypes.func.isRequired,
    rawMode: PropTypes.bool,
    plugins: ImmutablePropTypes.map,
    onSubmit: PropTypes.func,
    onAddAsset: PropTypes.func,
    getAsset: PropTypes.func,
    disabled: PropTypes.bool,
    onMarkClick: PropTypes.func,
    onBlockClick: PropTypes.func,
    onLinkClick: PropTypes.func,
    hasMark: PropTypes.func,
    hasInline: PropTypes.func,
    hasBlock: PropTypes.func,
  };

  isHidden = button => {
    const { buttons } = this.props;
    return List.isList(buttons) ? !buttons.includes(button) : false;
  };

  handleBlockClick = (event, type) => {
    if (event) {
      event.preventDefault();
    }
    this.props.onBlockClick(type);
  };

  handleMarkClick = (event, type) => {
    event.preventDefault();
    this.props.onMarkClick(type);
  };

  render() {
    const {
      onLinkClick,
      onToggleMode,
      rawMode,
      plugins,
      disabled,
      onSubmit,
      hasMark = () => {},
      hasInline = () => {},
      hasBlock = () => {},
    } = this.props;

    return (
      <ToolbarContainer>
        <div>
          <ToolbarButton
            type="bold"
            label="Bold"
            icon="bold"
            onClick={this.handleMarkClick}
            isActive={hasMark('bold')}
            isHidden={this.isHidden('bold')}
            disabled={disabled}
          />
          <ToolbarButton
            type="italic"
            label="Italic"
            icon="italic"
            onClick={this.handleMarkClick}
            isActive={hasMark('italic')}
            isHidden={this.isHidden('italic')}
            disabled={disabled}
          />
          <ToolbarButton
            type="code"
            label="Code"
            icon="code"
            onClick={this.handleMarkClick}
            isActive={hasMark('code')}
            isHidden={this.isHidden('code')}
            disabled={disabled}
          />
          <ToolbarButton
            type="link"
            label="Link"
            icon="link"
            onClick={onLinkClick}
            isActive={hasInline('link')}
            isHidden={this.isHidden('link')}
            disabled={disabled}
          />
          {/* Show dropdown if at least one heading is not hidden */}
          {Object.keys(headingOptions).some(optionKey => {
            return !this.isHidden(optionKey);
          }) && (
            <ToolbarDropdownWrapper>
              <Dropdown
                dropdownTopOverlap="36px"
                renderButton={() => (
                  <DropdownButton>
                    <ToolbarButton
                      type="headings"
                      label="Headings"
                      icon="hOptions"
                      disabled={disabled}
                      isActive={
                        !disabled &&
                        Object.keys(headingOptions).some(optionKey => {
                          return hasBlock(optionKey);
                        })
                      }
                    />
                  </DropdownButton>
                )}
              >
                {!disabled &&
                  Object.keys(headingOptions).map(
                    (optionKey, idx) =>
                      !this.isHidden(optionKey) && (
                        <DropdownItem
                          key={idx}
                          label={headingOptions[optionKey]}
                          className={hasBlock(optionKey) ? 'active' : ''}
                          onClick={() => this.handleBlockClick(null, optionKey)}
                        />
                      ),
                  )}
              </Dropdown>
            </ToolbarDropdownWrapper>
          )}
          <ToolbarButton
            type="quote"
            label="Quote"
            icon="quote"
            onClick={this.handleBlockClick}
            isActive={hasBlock('quote')}
            isHidden={this.isHidden('quote')}
            disabled={disabled}
          />
          <ToolbarButton
            type="bulleted-list"
            label="Bulleted List"
            icon="list-bulleted"
            onClick={this.handleBlockClick}
            isActive={hasBlock('bulleted-list')}
            isHidden={this.isHidden('bulleted-list')}
            disabled={disabled}
          />
          <ToolbarButton
            type="numbered-list"
            label="Numbered List"
            icon="list-numbered"
            onClick={this.handleBlockClick}
            isActive={hasBlock('numbered-list')}
            isHidden={this.isHidden('numbered-list')}
            disabled={disabled}
          />
          <ToolbarDropdownWrapper>
            <Dropdown
              dropdownTopOverlap="36px"
              dropdownWidth="110px"
              renderButton={() => (
                <DropdownButton>
                  <ToolbarButton
                    label="Add Component"
                    icon="add-with"
                    onClick={this.handleComponentsMenuToggle}
                    disabled={disabled}
                  />
                </DropdownButton>
              )}
            >
              {plugins &&
                plugins
                  .toList()
                  .map((plugin, idx) => (
                    <DropdownItem key={idx} label={plugin.label} onClick={() => onSubmit(plugin)} />
                  ))}
            </Dropdown>
          </ToolbarDropdownWrapper>
        </div>
        <ToolbarToggle>
          <ToolbarToggleLabel isActive={!rawMode} offPosition>
            Rich Text
          </ToolbarToggleLabel>
          <StyledToggle active={rawMode} onChange={onToggleMode} />
          <ToolbarToggleLabel isActive={rawMode}>Markdown</ToolbarToggleLabel>
        </ToolbarToggle>
      </ToolbarContainer>
    );
  }
}
