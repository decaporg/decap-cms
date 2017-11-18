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
  onPublish
}) => (
  <div class="nc-workflow-card">
    <h2>{title}</h2>
    <div>{`by ${ author }`}</div>
    <div>Last updated: {timestamp} by {authorLastChange}</div>
    <div className="nc-workflow-card-button-container">
      <Link className="nc-workflow-card-button" to={editLink}>Edit</Link>
      <button className="nc-workflow-card-button" onClick={onDelete}>Delete</button>
      {
        canPublish
          ? <button className="nc-workflow-card-button" onClick={onPublish}>Publish now</button>
          : null
      }
    </div>
  </div>
);

export default WorkflowCard;
