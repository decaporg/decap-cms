import React from 'react';
import UnpublishedEntriesPanel from './editorialWorkflow/UnpublishedEntriesPanel';
import styles from './breakpoints.css';


export default function DashboardPage() {
  return (
    <div className={styles.root}>
      <h1>Dashboard</h1>
      <UnpublishedEntriesPanel />
    </div>
  );
}
