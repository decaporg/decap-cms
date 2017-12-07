import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import c from 'classnames';
import { Link } from 'react-router-dom';

const WorkflowCard = ({
  collectionName,
  title,
  author,
  authorLastChange,
  body,
  isModification,
  editLink,
  timestamp,
  onDelete,
  canPublish,
  onPublish,
}) => (
  <div className="nc-workflow-card">
    <Link to={editLink} className="nc-workflow-link">
      <div className="nc-workflow-card-collection">{collectionName}</div>
      <h2 className="nc-workflow-card-title">{title}</h2>
      <div className="nc-workflow-card-date">{timestamp} by {authorLastChange}</div>
      <p className="nc-workflow-card-body">{body}</p>
    </Link>
    <div className="nc-workflow-card-button-container">
      <button className="nc-workflow-card-buttonDelete" onClick={onDelete}>
        {isModification ? 'Delete changes' : 'Delete new entry'}
      </button>
      <button
        className={c('nc-workflow-card-buttonPublish', {
          'nc-workflow-card-buttonPublishDisabled': !canPublish,
        })}
        onClick={onPublish}
      >
        {isModification ? 'Publish changes' : 'Publish new entry'}
      </button>
    </div>
  </div>
);

export default WorkflowCard;
