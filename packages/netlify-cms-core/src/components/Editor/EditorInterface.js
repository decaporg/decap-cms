import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { css, Global } from '@emotion/react';
import styled from '@emotion/styled';
import { ScrollSync, ScrollSyncPane } from 'react-scroll-sync';

import {
  colors,
  colorsRaw,
  components,
  transitions,
  IconButton,
  zIndex,
} from '../../ui';
import EditorControlPane from './EditorControlPane/EditorControlPane';
import EditorPreviewPane from './EditorPreviewPane/EditorPreviewPane';
import EditorToolbar from './EditorToolbar';
import { hasI18n, getI18nInfo, getPreviewEntry } from '../../lib/i18n';
import { FILES } from '../../constants/collectionTypes';
import { getFileFromSlug } from '../../reducers/collections';

const PREVIEW_VISIBLE = 'cms.preview-visible';
const I18N_VISIBLE = 'cms.i18n-visible';

const styles = {
  splitPane: css`
    ${components.card};
    border-radius: 0;
    height: 100%;
  `,
  pane: css`
    height: 100%;
  `,
};

const EditorToggle = styled(IconButton)`
  margin-bottom: 12px;
`;

function ReactSplitPaneGlobalStyles() {
  return (
    <Global
      styles={css`
        .Resizer.vertical {
          width: 21px;
          cursor: col-resize;
          position: relative;
          transition: background-color ${transitions.main};

          &:before {
            content: '';
            width: 2px;
            height: 100%;
            position: relative;
            left: 10px;
            background-color: ${colors.textFieldBorder};
            display: block;
          }

          &:hover,
          &:active {
            background-color: ${colorsRaw.GrayLight};
          }
        }
      `}
    />
  );
}

const StyledSplitPane = styled.div`
  display: grid;
  grid-template-columns: min(864px, 50%) auto;;
  height: 100%;

  > div:nth-child(2)::before {
    content: '';
    width: 2px;
    height: 100%;
    position: relative;
    background-color: rgb(223, 223, 227);
    display: block;
  }
`;

const NoPreviewContainer = styled.div`
  ${styles.splitPane};
`;

const EditorContainer = styled.div`
  width: 100%;
  min-width: 1200px;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
  padding-top: 66px;
`;

const Editor = styled.div`
  height: 100%;
  margin: 0 auto;
  position: relative;
  background-color: ${colorsRaw.white};
`;

const PreviewPaneContainer = styled.div`
  height: 100%;
  pointer-events: ${props => (props.blockEntry ? 'none' : 'auto')};
  overflow-y: ${props => (props.overFlow ? 'auto' : 'hidden')};
`;

const ControlPaneContainer = styled(PreviewPaneContainer)`
  padding: 0 16px;
  position: relative;
  overflow-x: hidden;
`;

const ViewControls = styled.div`
  position: fixed;
  bottom: 3px;
  right: 12px;
  z-index: ${zIndex.zIndex299};
`;

function EditorContent({
  i18nVisible,
  previewVisible,
  editor,
  editorWithEditor,
  editorWithPreview,
}) {
  if (i18nVisible) {
    return editorWithEditor;
  } else if (previewVisible) {
    return editorWithPreview;
  } else {
    return <NoPreviewContainer>{editor}</NoPreviewContainer>;
  }
}

function isPreviewEnabled(collection, entry) {
  if (collection.get('type') === FILES) {
    const file = getFileFromSlug(collection, entry.get('slug'));
    const previewEnabled = file?.getIn(['editor', 'preview']);
    if (previewEnabled != null) return previewEnabled;
  }
  return collection.getIn(['editor', 'preview'], true);
}

class EditorInterface extends Component {
  state = {
    previewVisible: localStorage.getItem(PREVIEW_VISIBLE) !== 'false',
    i18nVisible: localStorage.getItem(I18N_VISIBLE) !== 'false',
  };

  constructor(props) {
    super(props);

    this.props.loadScroll();
  }

  handleOnPersist = async (opts = {}) => {
    const { createNew = false, duplicate = false } = opts;
    await this.controlPaneRef.switchToDefaultLocale();
    this.controlPaneRef.validate();
    this.props.onPersist({ createNew, duplicate });
  };

  handleOnPublish = async (opts = {}) => {
    const { createNew = false, duplicate = false } = opts;
    await this.controlPaneRef.switchToDefaultLocale();
    this.controlPaneRef.validate();
    this.props.onPublish({ createNew, duplicate });
  };

  handleTogglePreview = () => {
    const newPreviewVisible = !this.state.previewVisible;
    this.setState({ previewVisible: newPreviewVisible });
    localStorage.setItem(PREVIEW_VISIBLE, newPreviewVisible);
  };

  handleToggleScrollSync = () => {
    const { toggleScroll } = this.props;
    toggleScroll();
  };

  handleToggleI18n = () => {
    const newI18nVisible = !this.state.i18nVisible;
    this.setState({ i18nVisible: newI18nVisible });
    localStorage.setItem(I18N_VISIBLE, newI18nVisible);
  };

  handleLeftPanelLocaleChange = locale => {
    this.setState({ leftPanelLocale: locale });
  };

  render() {
    const {
      collection,
      entry,
      fields,
      fieldsMetaData,
      fieldsErrors,
      onChange,
      showDelete,
      onDelete,
      onDeleteUnpublishedChanges,
      onChangeStatus,
      onPublish,
      unPublish,
      onDuplicate,
      onValidate,
      user,
      hasChanged,
      displayUrl,
      hasWorkflow,
      useOpenAuthoring,
      hasUnpublishedChanges,
      isNewEntry,
      isModification,
      currentStatus,
      onLogoutClick,
      loadDeployPreview,
      deployPreview,
      draftKey,
      editorBackLink,
      scrollSyncEnabled,
      t,
    } = this.props;

    const previewEnabled = isPreviewEnabled(collection, entry);

    const collectionI18nEnabled = hasI18n(collection);
    const { locales, defaultLocale } = getI18nInfo(this.props.collection);
    const editorProps = {
      collection,
      entry,
      fields,
      fieldsMetaData,
      fieldsErrors,
      onChange,
      onValidate,
    };

    const leftPanelLocale = this.state.leftPanelLocale || locales?.[0];
    const editor = (
      <ControlPaneContainer id="control-pane" overFlow>
        <EditorControlPane
          {...editorProps}
          ref={c => (this.controlPaneRef = c)}
          locale={leftPanelLocale}
          t={t}
          onLocaleChange={this.handleLeftPanelLocaleChange}
        />
      </ControlPaneContainer>
    );

    const editor2 = (
      <ControlPaneContainer overFlow={!this.props.scrollSyncEnabled}>
        <EditorControlPane {...editorProps} locale={locales?.[1]} t={t} />
      </ControlPaneContainer>
    );

    const previewEntry = collectionI18nEnabled
      ? getPreviewEntry(entry, leftPanelLocale, defaultLocale)
      : entry;

    const editorWithPreview = (
      <>
        <ReactSplitPaneGlobalStyles />
        <StyledSplitPane>
          <ScrollSyncPane>{editor}</ScrollSyncPane>
          <PreviewPaneContainer>
            <EditorPreviewPane
              collection={collection}
              entry={previewEntry}
              fields={fields}
              fieldsMetaData={fieldsMetaData}
              locale={leftPanelLocale}
            />
          </PreviewPaneContainer>
        </StyledSplitPane>
      </>
    );

    const editorWithEditor = (
      <ScrollSync enabled={this.props.scrollSyncEnabled}>
        <div>
          <StyledSplitPane>
            <ScrollSyncPane>{editor}</ScrollSyncPane>
            <ScrollSyncPane>{editor2}</ScrollSyncPane>
          </StyledSplitPane>
        </div>
      </ScrollSync>
    );

    const i18nVisible = collectionI18nEnabled && this.state.i18nVisible;
    const previewVisible = previewEnabled && this.state.previewVisible;
    const scrollSyncVisible = i18nVisible || previewVisible;

    return (
      <EditorContainer>
        <EditorToolbar
          isPersisting={entry.get('isPersisting')}
          isPublishing={entry.get('isPublishing')}
          isUpdatingStatus={entry.get('isUpdatingStatus')}
          isDeleting={entry.get('isDeleting')}
          onPersist={this.handleOnPersist}
          onPersistAndNew={() => this.handleOnPersist({ createNew: true })}
          onPersistAndDuplicate={() => this.handleOnPersist({ createNew: true, duplicate: true })}
          onDelete={onDelete}
          onDeleteUnpublishedChanges={onDeleteUnpublishedChanges}
          onChangeStatus={onChangeStatus}
          showDelete={showDelete}
          onPublish={onPublish}
          unPublish={unPublish}
          onDuplicate={onDuplicate}
          onPublishAndNew={() => this.handleOnPublish({ createNew: true })}
          onPublishAndDuplicate={() => this.handleOnPublish({ createNew: true, duplicate: true })}
          user={user}
          hasChanged={hasChanged}
          displayUrl={displayUrl}
          collection={collection}
          hasWorkflow={hasWorkflow}
          useOpenAuthoring={useOpenAuthoring}
          hasUnpublishedChanges={hasUnpublishedChanges}
          isNewEntry={isNewEntry}
          isModification={isModification}
          currentStatus={currentStatus}
          onLogoutClick={onLogoutClick}
          loadDeployPreview={loadDeployPreview}
          deployPreview={deployPreview}
          editorBackLink={editorBackLink}
        />
        <Editor key={draftKey}>
          <ViewControls>
            {collectionI18nEnabled && (
              <EditorToggle
                isActive={i18nVisible}
                onClick={this.handleToggleI18n}
                size="large"
                type="page"
                title={t('editor.editorInterface.toggleI18n')}
                marginTop="70px"
              />
            )}
            {previewEnabled && (
              <EditorToggle
                isActive={previewVisible}
                onClick={this.handleTogglePreview}
                size="large"
                type="eye"
                title={t('editor.editorInterface.togglePreview')}
              />
            )}
            {scrollSyncVisible && (
              <EditorToggle
                isActive={scrollSyncEnabled}
                onClick={this.handleToggleScrollSync}
                size="large"
                type="scroll"
                title={t('editor.editorInterface.toggleScrollSync')}
              />
            )}
          </ViewControls>
          <EditorContent
            i18nVisible={i18nVisible}
            previewVisible={previewVisible}
            editor={editor}
            editorWithEditor={editorWithEditor}
            editorWithPreview={editorWithPreview}
          />
        </Editor>
      </EditorContainer>
    );
  }
}

EditorInterface.propTypes = {
  collection: ImmutablePropTypes.map.isRequired,
  entry: ImmutablePropTypes.map.isRequired,
  fields: ImmutablePropTypes.list.isRequired,
  fieldsMetaData: ImmutablePropTypes.map.isRequired,
  fieldsErrors: ImmutablePropTypes.map.isRequired,
  onChange: PropTypes.func.isRequired,
  onValidate: PropTypes.func.isRequired,
  onPersist: PropTypes.func.isRequired,
  showDelete: PropTypes.bool.isRequired,
  onDelete: PropTypes.func.isRequired,
  onDeleteUnpublishedChanges: PropTypes.func.isRequired,
  onPublish: PropTypes.func.isRequired,
  unPublish: PropTypes.func.isRequired,
  onDuplicate: PropTypes.func.isRequired,
  onChangeStatus: PropTypes.func.isRequired,
  user: PropTypes.object,
  hasChanged: PropTypes.bool,
  displayUrl: PropTypes.string,
  hasWorkflow: PropTypes.bool,
  useOpenAuthoring: PropTypes.bool,
  hasUnpublishedChanges: PropTypes.bool,
  isNewEntry: PropTypes.bool,
  isModification: PropTypes.bool,
  currentStatus: PropTypes.string,
  onLogoutClick: PropTypes.func.isRequired,
  deployPreview: PropTypes.object,
  loadDeployPreview: PropTypes.func.isRequired,
  draftKey: PropTypes.string.isRequired,
  toggleScroll: PropTypes.func.isRequired,
  scrollSyncEnabled: PropTypes.bool.isRequired,
  loadScroll: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};

export default EditorInterface;
