import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from '@emotion/styled';
import { css } from '@emotion/react';
import color from 'color';
import { List } from 'immutable';
import {
  Button,
  ButtonGroup,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownMenuItem,
} from 'decap-cms-ui-next';

import ToolbarButton from './ToolbarButton';

const ToolbarContainer = styled.div`
  display: flex;
`;

const ToolbarButtonsStart = styled(ButtonGroup)`
  margin: 0 -0.5rem;
  flex: 1;
`;

const ToolbarButtonsEnd = styled(ButtonGroup)`
  margin: 0 -0.5rem;
`;

const ToolbarSeparator = styled.div`
  width: 1px;
  height: 2rem;
  margin: 0 10px;
  background-color: ${({ theme }) => theme.color.border};
`;

const ModeButtonGroup = styled(ButtonGroup)`
  ${({ theme }) => css`
    background-color: ${color(theme.color.neutral['700']).alpha(0.1).string()};
    border-radius: 8px;
    margin: initial;
  `}
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

  constructor(props) {
    super(props);
    this.state = {
      rawModeAnchorEl: null,
      editorComponentsAnchorEl: null,
      headingsAnchorEl: null,
    };
  }

  setRawModeAnchorEl = rawModeAnchorEl => {
    this.setState({ rawModeAnchorEl });
  };

  setEditorComponentsAnchorEl = editorComponentsAnchorEl => {
    this.setState({ editorComponentsAnchorEl });
  };

  setHeadingsAnchorEl = headingsAnchorEl => {
    this.setState({ headingsAnchorEl });
  };

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
      onToggleFullscreen,
      rawMode,
      isFullscreen,
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
    };

    return (
      <ToolbarContainer>
        <ToolbarButtonsStart>
          {showEditorComponents && (
            <Dropdown>
              <DropdownTrigger>
                <ToolbarButton
                  icon="plus"
                  label={t('editor.editorWidgets.markdown.addComponent')}
                  disabled={disabled}
                  hasMenu
                />
              </DropdownTrigger>

              <DropdownMenu anchorOrigin={{ x: 'left' }} transformOrigin={{ x: 'left' }}>
                {pluginsList.map((plugin, idx) => (
                  <DropdownMenuItem key={idx} icon={plugin.id} onClick={() => onSubmit(plugin)}>
                    {plugin.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          )}

          {/* Show dropdown if at least one heading is not hidden */}
          {Object.keys(headingOptions).some(isVisible) && (
            <Dropdown>
              <DropdownTrigger>
                <ToolbarButton
                  type="headings"
                  label={t('editor.editorWidgets.markdown.headings')}
                  icon="heading"
                  disabled={disabled}
                  hasMenu
                />
              </DropdownTrigger>

              <DropdownMenu anchorOrigin={{ x: 'left' }} transformOrigin={{ x: 'left' }}>
                {!disabled &&
                  Object.keys(headingOptions).map(
                    (optionKey, idx) =>
                      isVisible(optionKey) && (
                        <DropdownMenuItem
                          key={idx}
                          icon={optionKey}
                          selected={hasBlock(optionKey)}
                          onClick={() => this.handleBlockClick(null, optionKey)}
                        >
                          {headingOptions[optionKey]}
                        </DropdownMenuItem>
                      ),
                  )}
              </DropdownMenu>
            </Dropdown>
          )}

          <ToolbarSeparator />

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

          <ToolbarSeparator />

          {isVisible('bulleted-list') && (
            <ToolbarButton
              type="bulleted-list"
              label={t('editor.editorWidgets.markdown.bulletedList')}
              icon="bulleted-list"
              onClick={this.handleBlockClick}
              isActive={hasListItems('bulleted-list')}
              disabled={disabled}
            />
          )}
          {isVisible('numbered-list') && (
            <ToolbarButton
              type="numbered-list"
              label={t('editor.editorWidgets.markdown.numberedList')}
              icon="numbered-list"
              onClick={this.handleBlockClick}
              isActive={hasListItems('numbered-list')}
              disabled={disabled}
            />
          )}
        </ToolbarButtonsStart>
        <ToolbarButtonsEnd>
          <ToolbarButton
            label="Fullscreen"
            icon={isFullscreen ? 'minimize' : 'maximize'}
            onClick={onToggleFullscreen}
          />

          {isShowModeToggle && (
            <ModeButtonGroup>
              <Button
                transparent={rawMode}
                type={rawMode ? 'neutral' : 'primary'}
                variant="soft"
                size="sm"
                onClick={rawMode ? onToggleMode : undefined}
              >
                {t('editor.editorWidgets.markdown.richText')}
              </Button>
              <Button
                transparent={!rawMode}
                type={rawMode ? 'primary' : 'neutral'}
                variant="soft"
                size="sm"
                onClick={!rawMode ? onToggleMode : undefined}
              >
                {t('editor.editorWidgets.markdown.markdown')}
              </Button>
            </ModeButtonGroup>
          )}
        </ToolbarButtonsEnd>
      </ToolbarContainer>
    );
  }
}
