import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from '@emotion/styled';
import { css } from '@emotion/react';
import { List } from 'immutable';
import {
  Toggle,
  Dropdown,
  DropdownItem,
  DropdownButton,
  colors,
  transitions,
  lengths,
} from 'decap-cms-ui-default';

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
  min-width: ${props => (props.offPosition ? '62px' : '70px')};

  ${props =>
    props.isActive &&
    css`
      font-weight: 600;
      color: ${colors.active};
    `};
`;

export default class Toolbar extends React.Component {
  static propTypes = {
    buttons: ImmutablePropTypes.list,
    editorComponents: ImmutablePropTypes.list,
    onToggleMode: PropTypes.func.isRequired,
    rawMode: PropTypes.bool,
    isShowModeToggle: PropTypes.bool.isRequired,
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
    t: PropTypes.func.isRequired,
  };

  componentDidMount() {
    // Manually validate PropTypes - React 19 breaking change
    PropTypes.checkPropTypes(Toolbar.propTypes, this.props, 'prop', 'Toolbar');
  }

  isVisible = button => {
    const { buttons } = this.props;
    return !List.isList(buttons) || buttons.includes(button);
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
      isShowModeToggle,
      plugins,
      disabled,
      onSubmit,
      hasMark = () => {},
      hasInline = () => {},
      hasBlock = () => {},
      hasQuote = () => {},
      hasListItems = () => {},
      editorComponents,
      t,
    } = this.props;
    const isVisible = this.isVisible;
    const showEditorComponents = !editorComponents || editorComponents.size >= 1;

    function showPlugin({ id }) {
      return editorComponents ? editorComponents.includes(id) : true;
    }

    const pluginsList = plugins ? plugins.toList().filter(showPlugin) : List();

    const headingOptions = {
      'heading-one': t('editor.editorWidgets.headingOptions.headingOne'),
      'heading-two': t('editor.editorWidgets.headingOptions.headingTwo'),
      'heading-three': t('editor.editorWidgets.headingOptions.headingThree'),
      'heading-four': t('editor.editorWidgets.headingOptions.headingFour'),
      'heading-five': t('editor.editorWidgets.headingOptions.headingFive'),
      'heading-six': t('editor.editorWidgets.headingOptions.headingSix'),
    };

    return (
      <ToolbarContainer>
        <div>
          {isVisible('bold') && (
            <ToolbarButton
              type="bold"
              label={t('editor.editorWidgets.markdown.bold')}
              icon="bold"
              onClick={this.handleMarkClick}
              isActive={hasMark('bold')}
              disabled={disabled}
            />
          )}
          {isVisible('italic') && (
            <ToolbarButton
              type="italic"
              label={t('editor.editorWidgets.markdown.italic')}
              icon="italic"
              onClick={this.handleMarkClick}
              isActive={hasMark('italic')}
              disabled={disabled}
            />
          )}
          {isVisible('strikethrough') && (
            <ToolbarButton
              type="strikethrough"
              label={t('editor.editorWidgets.markdown.strikethrough')}
              icon="strikethrough"
              onClick={this.handleMarkClick}
              isActive={hasMark('delete')}
              disabled={disabled}
            />
          )}
          {isVisible('code') && (
            <ToolbarButton
              type="code"
              label={t('editor.editorWidgets.markdown.code')}
              icon="code"
              onClick={this.handleMarkClick}
              isActive={hasMark('code')}
              disabled={disabled}
            />
          )}
          {isVisible('link') && (
            <ToolbarButton
              type="link"
              label={t('editor.editorWidgets.markdown.link')}
              icon="link"
              onClick={onLinkClick}
              isActive={hasInline('link')}
              disabled={disabled}
            />
          )}
          {/* Show dropdown if at least one heading is not hidden */}
          {Object.keys(headingOptions).some(isVisible) && (
            <ToolbarDropdownWrapper>
              <Dropdown
                dropdownWidth="max-content"
                dropdownTopOverlap="36px"
                renderButton={() => (
                  <DropdownButton>
                    <ToolbarButton
                      type="headings"
                      label={t('editor.editorWidgets.markdown.headings')}
                      icon="hOptions"
                      disabled={disabled}
                      isActive={!disabled && Object.keys(headingOptions).some(hasBlock)}
                    />
                  </DropdownButton>
                )}
              >
                {!disabled &&
                  Object.keys(headingOptions).map(
                    (optionKey, idx) =>
                      isVisible(optionKey) && (
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
          {isVisible('quote') && (
            <ToolbarButton
              type="quote"
              label={t('editor.editorWidgets.markdown.quote')}
              icon="quote"
              onClick={this.handleBlockClick}
              isActive={hasQuote('quote')}
              disabled={disabled}
            />
          )}
          {isVisible('bulleted-list') && (
            <ToolbarButton
              type="bulleted-list"
              label={t('editor.editorWidgets.markdown.bulletedList')}
              icon="list-bulleted"
              onClick={this.handleBlockClick}
              isActive={hasListItems('bulleted-list')}
              disabled={disabled}
            />
          )}
          {isVisible('numbered-list') && (
            <ToolbarButton
              type="numbered-list"
              label={t('editor.editorWidgets.markdown.numberedList')}
              icon="list-numbered"
              onClick={this.handleBlockClick}
              isActive={hasListItems('numbered-list')}
              disabled={disabled}
            />
          )}
          {showEditorComponents && (
            <ToolbarDropdownWrapper>
              <Dropdown
                dropdownTopOverlap="36px"
                dropdownWidth="max-content"
                renderButton={() => (
                  <DropdownButton>
                    <ToolbarButton
                      label={t('editor.editorWidgets.markdown.addComponent')}
                      icon="add-with"
                      onClick={this.handleComponentsMenuToggle}
                      disabled={disabled}
                    />
                  </DropdownButton>
                )}
              >
                {pluginsList.map((plugin, idx) => (
                  <DropdownItem key={idx} label={plugin.label} onClick={() => onSubmit(plugin)} />
                ))}
              </Dropdown>
            </ToolbarDropdownWrapper>
          )}
        </div>
        {isShowModeToggle && (
          <ToolbarToggle>
            <ToolbarToggleLabel isActive={!rawMode} offPosition>
              {t('editor.editorWidgets.markdown.richText')}
            </ToolbarToggleLabel>
            <StyledToggle active={rawMode} onChange={onToggleMode} />
            <ToolbarToggleLabel isActive={rawMode}>
              {t('editor.editorWidgets.markdown.markdown')}
            </ToolbarToggleLabel>
          </ToolbarToggle>
        )}
      </ToolbarContainer>
    );
  }
}
