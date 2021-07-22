import PropTypes from 'prop-types';
import React from 'react';
import styled from '@emotion/styled';
import { connect } from 'react-redux';
import { Loader } from 'netlify-cms-ui-default';
import { listNotes } from 'Actions/notes';
import ImmutablePropTypes from 'react-immutable-proptypes';

const NoteListContainer = styled.div`
  flex: 1;
  padding: 16px;
`;

const NoteContainer = styled.div`
  display: flex;
  min-height: 56px;
  width: 100%;
  margin-bottom: 24px;
`;

const ImageContainer = styled.div`
  border-radius: 100%;
  height: 32px;
  width: 32px;
  border: 1px solid black;
  margin: 8px;
  padding: 6px 0 0 1px;
`;

const NoteInfoContainer = styled.div`
  border: 1px solid black;
  flex: 1;
  border-radius: 4px;
`;

const NoteToolbarContainer = styled.div`
  height: 48px;
  padding: 12px 8px;
  display: flex;
  background-color: #f6f8fa;
  color: #586069;
  p {
    margin-right: 8px;
  }
`;

const NoteTextContainer = styled.div`
  min-height: 48px;
  padding: 12px 8px;
`;

export function AuthorImage() {
  return <ImageContainer>Img</ImageContainer>;
}

export function NoteToolbar(props) {
  const { author, createdAt } = props;
  return (
    <NoteToolbarContainer>
      <p>Author</p>
      <p>commented on</p>
      <p>{createdAt}</p>
    </NoteToolbarContainer>
  );
}

export class Note extends React.Component {
  render() {
    const {
      note: { id: key, data: value, author, created_at: createdAt },
    } = this.props;
    return (
      <NoteContainer key={key}>
        <AuthorImage author={author} />
        <NoteInfoContainer>
          <NoteToolbar author={author} createdAt={createdAt} />
          <NoteTextContainer>{value}</NoteTextContainer>
        </NoteInfoContainer>
      </NoteContainer>
    );
  }
}

class NoteList extends React.Component {
  componentDidMount() {
    const { listNotes, collection, slug } = this.props;
    listNotes(collection, slug);
  }

  render() {
    const { isFetching, t, notes } = this.props;

    const loadingMessages = [
      t('notes.loadingEntries'),
      t('notes.cachingEntries'),
      t('notes.longerLoading'),
    ];

    if (isFetching) {
      return (
        <NoteListContainer>
          <Loader active>{loadingMessages}</Loader>
        </NoteListContainer>
      );
    }

    return (
      <NoteListContainer>
        {notes.map(note => (
          <Note key={note.id} note={note} />
        ))}
      </NoteListContainer>
    );
  }
}

NoteList.propTypes = {
  collection: ImmutablePropTypes.map.isRequired,
  isFetching: PropTypes.bool,
  notes: ImmutablePropTypes.list.isRequired,
  error: PropTypes.string.isRequired,
  hasWorkflow: PropTypes.bool,
  draftKey: PropTypes.string.isRequired,
  slug: PropTypes.string.isRequired,
  t: PropTypes.func.isRequired,
};

function mapStateToProps(state, ownProps) {
  const { collection, slug } = ownProps;
  const collectionName = collection.get('name');
  const { notes: parent } = state;
  const isFetching = parent.getIn(['notes', `${collectionName}.${slug}`, 'isFetching']) || false;
  const notes = parent.getIn(['notes', `${collectionName}.${slug}`, 'data']) || [];
  const error = parent.getIn(['notes', `${collectionName}.${slug}`, 'error']) || '';
  return { isFetching, notes, error };
}

const mapDispatchToProps = {
  listNotes,
};

export default connect(mapStateToProps, mapDispatchToProps)(NoteList);
