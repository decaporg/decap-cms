import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
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
  <Link to={editLink} className="nc-workflow-card">
    <div className="nc-workflow-card-collection">{collectionName}</div>
    <h2 className="nc-workflow-card-title">{title}</h2>
    <div className="nc-workflow-card-date">{timestamp} by {authorLastChange}</div>
    <p className="nc-workflow-card-body">{body}</p>
  </Link>
);

export default WorkflowCard;

/*
    <div className="nc-workflow-card-button-container">
      <Link className="nc-workflow-card-button" to={editLink}>Edit</Link>
      <button className="nc-workflow-card-button" onClick={onDelete}>Delete</button>
      {
        canPublish
          ? <button className="nc-workflow-card-button" onClick={onPublish}>Publish now</button>
          : null
      }
    </div>
    */
