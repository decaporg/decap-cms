import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/core/i18n', () => ({
  translate: () => (Component: React.ComponentType<any>) => {
    return function Translated(props: any) {
      return <Component {...props} t={(key: string) => key} />;
    };
  },
}));

vi.mock('@/core/hooks/useRedux', () => ({
  useAppDispatch: () => () => undefined,
  // The only store read is the creatable-collection names (Quick add).
  useAppSelector: () => [],
}));

// Effective user scopes come from the store through useCurrentUserScopes;
// none of these tests restrict collections by scope.
vi.mock('@/core/hooks/useCurrentUserScopes', () => ({
  useCurrentUserScopes: () => [],
}));

vi.mock('@/core/actions/status', () => ({
  checkBackendStatus: vi.fn(),
}));

vi.mock('@/core/components/UI', () => ({
  OfflineIndicator: () => null,
  SettingsDropdown: () => <div data-testid="settings-dropdown" />,
}));

import Header from '@/app/components/Header';
import { RouterProvider } from '@/core/routing/context';
import { colors } from '@/ui/default/styles';

import type { Router } from '@/core/routing/router';

function createTestRouter(pathname: string): Router {
  return {
    location: () => ({ pathname, search: '' }),
    push: vi.fn(),
    replace: vi.fn(),
    href: (path: string) => `#${path}`,
    subscribe: vi.fn(() => () => {}),
    block: vi.fn(() => () => {}),
  };
}

const baseProps = {
  user: { name: 'Alice' },
  collections: {
    posts: {
      name: 'posts',
      label: 'Posts',
      label_singular: 'Post',
      create: true,
    } as any,
  },
  onCreateEntryClick: vi.fn(),
  onLogoutClick: vi.fn(),
  openMediaLibrary: vi.fn(),
  hasWorkflow: true,
  isTestRepo: false,
  showMediaButton: true,
};

function renderHeaderAt(pathname: string) {
  return render(
    <RouterProvider router={createTestRouter(pathname)}>
      <Header {...baseProps} />
    </RouterProvider>,
  );
}

describe('Header nav aria-current (DCMS-1346)', () => {
  it.each(['/', '/collections/posts', '/collections/restaurants', '/media'])(
    'marks the Contents link aria-current="page" on %s',
    pathname => {
      renderHeaderAt(pathname);

      const contentLink = screen.getByLabelText('app.header.content');
      const workflowLink = screen.getByLabelText('app.header.workflow');

      expect(contentLink).toHaveAttribute('aria-current', 'page');
      expect(workflowLink).not.toHaveAttribute('aria-current');
    },
  );

  it('marks the Workflow link aria-current="page" on /workflow and leaves Contents unset', () => {
    renderHeaderAt('/workflow');

    const contentLink = screen.getByLabelText('app.header.content');
    const workflowLink = screen.getByLabelText('app.header.workflow');

    expect(workflowLink).toHaveAttribute('aria-current', 'page');
    expect(contentLink).not.toHaveAttribute('aria-current');
  });
});

/**
 * Regression test for DCMS-1390: the AppHeader nav labels ("Contents",
 * "Media", "Workflow") and their icons used a hardcoded `#7b8290` /
 * `#b3b9c4`, which resolve to 3.86:1 and 2.24:1 contrast on the white header
 * background - below the WCAG 2.1 AA 4.5:1 (text) and 1.4.11 3:1
 * (non-text/icon) thresholds. Both now read `colors.controlLabel`
 * (`#5D626F`, 6.1:1 on white), a themeable token instead of a one-off hex.
 */
// jsdom's CSSOM serializes custom-property names and hex values in
// `getComputedStyle` as lowercase, unlike the mixed-case tokens exported from
// `styles.tsx` (e.g. `var(--decap-color-controlLabel, #5D626F)`), so
// comparisons here are case-insensitive rather than using RTL's
// `toHaveStyle` (which does an exact string match).
function computedColor(el: Element) {
  return window.getComputedStyle(el).color.toLowerCase();
}

describe('Header nav label contrast (DCMS-1390)', () => {
  it('renders an inactive nav label (Workflow, on "/") with the controlLabel token color', () => {
    renderHeaderAt('/');

    // At "/" only Contents is active, so Workflow is in its resting state.
    const workflowLink = screen.getByLabelText('app.header.workflow');

    expect(computedColor(workflowLink)).toBe(colors.controlLabel.toLowerCase());
  });

  it('renders the Media button (never carries the active class) with the controlLabel token color', () => {
    renderHeaderAt('/');

    const mediaButton = screen.getByLabelText('app.header.media');

    expect(computedColor(mediaButton)).toBe(colors.controlLabel.toLowerCase());
  });

  it('renders the resting-state nav icon with the controlLabel token color, not the old low-contrast hex', () => {
    renderHeaderAt('/');

    const workflowLink = screen.getByLabelText('app.header.workflow');
    const icon = workflowLink.querySelector('.decap-icon');

    expect(icon).toBeTruthy();
    expect(computedColor(icon as Element)).toBe(colors.controlLabel.toLowerCase());
  });

  it('keeps the active-state color (colors.active) visually distinct from the resting controlLabel color', () => {
    renderHeaderAt('/');

    const contentLink = screen.getByLabelText('app.header.content');

    expect(computedColor(contentLink)).toBe(colors.active.toLowerCase());
    expect(colors.active.toLowerCase()).not.toBe(colors.controlLabel.toLowerCase());
  });
});
