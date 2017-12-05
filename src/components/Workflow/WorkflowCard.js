import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { Link } from 'react-router-dom';

const WorkflowCard = ({
  title,
  author,
  authorLastChange,
  isModification,
  editLink,
  timestamp,
  onDelete,
  canPublish,
  onPublish,
}) => (
  <Link to={editLink} className="nc-workflow-card">
    <span>Post</span>
    <h2>{title}</h2>
    <div>Updated {timestamp} by {authorLastChange}</div>
    <div>Body text here</div>
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
