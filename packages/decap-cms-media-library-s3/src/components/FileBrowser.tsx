/**
 * File Browser Navigation Component
 * Displays breadcrumbs and navigation controls
 */

import React from 'react';

const styles = {
  browser: {
    padding: '16px 24px',
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  controls: {
    marginBottom: '12px',
  },
  backButton: {
    padding: '6px 12px',
    backgroundColor: '#f0f0f0',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  backButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed' as const,
  },
  breadcrumbs: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '4px',
    flexWrap: 'wrap' as const,
    marginBottom: '8px',
    overflowX: 'auto' as const,
    paddingBottom: '4px',
  },
  breadcrumb: {
    padding: '4px 8px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#0066cc',
    cursor: 'pointer',
    fontSize: '13px',
    whiteSpace: 'nowrap' as const,
    transition: 'all 0.2s',
    borderRadius: '3px',
  },
  breadcrumbActive: {
    color: '#333',
    fontWeight: 600 as const,
    backgroundColor: 'rgba(0, 102, 204, 0.05)',
    cursor: 'default',
  },
  separator: {
    color: '#999',
    margin: '0 2px',
    fontSize: '12px',
    userSelect: 'none' as const,
  },
  pathDisplay: {
    fontSize: '11px',
    color: '#999',
    fontFamily: '"Monaco", "Courier New", monospace',
    backgroundColor: 'white',
    padding: '4px 8px',
    borderRadius: '3px',
    border: '1px solid #eee',
    wordBreak: 'break-all' as const,
    maxHeight: '40px',
    overflowY: 'auto' as const,
  },
};

interface FileBrowserProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onParentDirectory: () => void;
}

export function FileBrowser({ currentPath, onNavigate, onParentDirectory }: FileBrowserProps) {
  function getBreadcrumbs(path: string): { label: string; path: string }[] {
    const breadcrumbs = [{ label: 'Root', path: '/' }];

    if (path === '/') {
      return breadcrumbs;
    }

    const parts = path.split('/').filter(p => p);
    let currentBreadcrumbPath = '/';

    parts.forEach(part => {
      currentBreadcrumbPath = `${currentBreadcrumbPath}${part}/`;
      breadcrumbs.push({ label: part, path: currentBreadcrumbPath });
    });

    return breadcrumbs;
  }

  const breadcrumbs = getBreadcrumbs(currentPath);
  const canGoUp = currentPath !== '/';

  return (
    <div style={styles.browser}>
      {/* Navigation Controls */}
      <div style={styles.controls}>
        <button
          style={{
            ...styles.backButton,
            ...(canGoUp ? {} : styles.backButtonDisabled),
          }}
          onClick={onParentDirectory}
          disabled={!canGoUp}
          title="Go to parent directory"
          onMouseEnter={
            canGoUp ? e => (e.currentTarget.style.backgroundColor = '#e0e0e0') : undefined
          }
          onMouseLeave={
            canGoUp ? e => (e.currentTarget.style.backgroundColor = '#f0f0f0') : undefined
          }
        >
          ← Back
        </button>
      </div>

      {/* Breadcrumb Trail */}
      <div style={styles.breadcrumbs}>
        {breadcrumbs.map((breadcrumb, index) => (
          <React.Fragment key={breadcrumb.path}>
            {index > 0 && <span style={styles.separator}>/</span>}
            <button
              style={{
                ...styles.breadcrumb,
                ...(breadcrumb.path === currentPath ? styles.breadcrumbActive : {}),
              }}
              onClick={() => onNavigate(breadcrumb.path)}
              onMouseEnter={
                breadcrumb.path !== currentPath
                  ? e => (e.currentTarget.style.backgroundColor = 'rgba(0, 102, 204, 0.1)')
                  : undefined
              }
              onMouseLeave={
                breadcrumb.path !== currentPath
                  ? e => (e.currentTarget.style.backgroundColor = 'transparent')
                  : undefined
              }
            >
              {breadcrumb.label}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Current Path Display */}
      <div style={styles.pathDisplay}>{currentPath}</div>
    </div>
  );
}

export default FileBrowser;
