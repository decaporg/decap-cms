import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from '@emotion/styled';
import { List } from 'immutable';
import { Button, ButtonGroup, Menu, MenuItem } from 'decap-cms-ui-next';

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
      paragraph: 'Paragraph', // 'Paragraph
      'heading-one': t('editor.editorWidgets.headingOptions.headingOne'),
      'heading-two': t('editor.editorWidgets.headingOptions.headingTwo'),
      'heading-three': t('editor.editorWidgets.headingOptions.headingThree'),
      'heading-four': t('editor.editorWidgets.headingOptions.headingFour'),
      'heading-five': t('editor.editorWidgets.headingOptions.headingFive'),
      'heading-six': t('editor.editorWidgets.headingOptions.headingSix'),
    };

    return (
      <ToolbarContainer>
        <ToolbarButtonsStart>
          {showEditorComponents && (
            <>
              <ToolbarButton
                icon="plus"
                label={t('editor.editorWidgets.markdown.addComponent')}
                onClick={e => this.setEditorComponentsAnchorEl(e.currentTarget)}
                disabled={disabled}
                hasMenu
              />

              <Menu
                open={!!this.state.editorComponentsAnchorEl}
                anchorOrigin={{ x: 'left' }}
                transformOrigin={{ x: 'left' }}
                anchorEl={this.state.editorComponentsAnchorEl}
                onClose={() => this.setEditorComponentsAnchorEl(null)}
              >
                {pluginsList.map((plugin, idx) => (
                  <MenuItem key={idx} icon={plugin.id} onClick={() => onSubmit(plugin)}>
                    {plugin.label}
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}

          {/* Show dropdown if at least one heading is not hidden */}
          {Object.keys(headingOptions).some(isVisible) && (
            <>
              <ToolbarButton
                type="headings"
                label={'Turn into'}
                onClick={e => this.setHeadingsAnchorEl(e.currentTarget)}
                disabled={disabled}
                hasMenu
              >
                {t('editor.editorWidgets.markdown.headings')}
              </ToolbarButton>

              <Menu
                open={!!this.state.headingsAnchorEl}
                anchorEl={this.state.headingsAnchorEl}
                anchorOrigin={{ x: 'left' }}
                transformOrigin={{ x: 'left' }}
                onClose={() => this.setHeadingsAnchorEl(null)}
              >
                {!disabled &&
                  Object.keys(headingOptions).map(
                    (optionKey, idx) =>
                      isVisible(optionKey) && (
                        <MenuItem
                          key={idx}
                          icon={optionKey}
                          selected={hasBlock(optionKey)}
                          onClick={() => this.handleBlockClick(null, optionKey)}
                        >
                          {headingOptions[optionKey]}
                        </MenuItem>
                      ),
                  )}
              </Menu>
            </>
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
            <>
              <Button onClick={e => this.setRawModeAnchorEl(e.currentTarget)} hasMenu>
                {rawMode
                  ? t('editor.editorWidgets.markdown.markdown')
                  : t('editor.editorWidgets.markdown.richText')}
              </Button>

              <Menu
                open={!!this.state.rawModeAnchorEl}
                anchorEl={this.state.rawModeAnchorEl}
                onClose={() => this.setRawModeAnchorEl(null)}
              >
                <MenuItem selected={!rawMode} onClick={onToggleMode}>
                  {t('editor.editorWidgets.markdown.richText')}
                </MenuItem>
                <MenuItem selected={rawMode} onClick={onToggleMode}>
                  {t('editor.editorWidgets.markdown.markdown')}
                </MenuItem>
              </Menu>
            </>
          )}
        </ToolbarButtonsEnd>
      </ToolbarContainer>
    );
  }
}
