import { Combobox as ComboboxPrimitive } from '@base-ui/react/combobox';
import * as React from 'react';

import { CheckIcon, ChevronDownIcon, XIcon } from '@/ui/icons/index';
import { css, type WithClassName } from './styled';

export function Combobox<Value, Multiple extends boolean | undefined = false>(
  props: React.ComponentProps<typeof ComboboxPrimitive.Root<Value, Multiple>>,
): React.ReactNode {
  return <ComboboxPrimitive.Root {...props} />;
}

export function ComboboxValue(
  props: React.ComponentProps<typeof ComboboxPrimitive.Value>,
): React.ReactNode {
  return <ComboboxPrimitive.Value {...props} />;
}

const inputGroupClass = css`
  display: flex;
  width: 100%;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.375rem;
  border-radius: 0.375rem;
  border: 1px solid var(--input);
  background-color: transparent;
  padding: 0.375rem 0.5rem;
  outline: none;
  transition:
    color 0.15s,
    box-shadow 0.15s;
  &:has([data-focused]) {
    border-color: var(--ring);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--ring), transparent 50%);
  }
  &[data-disabled] {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

export function ComboboxInputGroup({
  className,
  ...props
}: WithClassName<React.ComponentProps<typeof ComboboxPrimitive.InputGroup>>): React.ReactNode {
  return (
    <ComboboxPrimitive.InputGroup
      data-slot="combobox-input-group"
      css={inputGroupClass}
      className={className}
      {...props}
    />
  );
}

const inputClass = css`
  min-width: 3rem;
  flex: 1 1 auto;
  border: 0;
  background: transparent;
  padding: 0.125rem 0;
  font-size: 0.875rem;
  outline: none;
  &::placeholder {
    color: var(--muted-foreground);
  }
  &:disabled {
    cursor: not-allowed;
  }
`;

export function ComboboxInput({
  className,
  ...props
}: WithClassName<React.ComponentProps<typeof ComboboxPrimitive.Input>>): React.ReactNode {
  return (
    <ComboboxPrimitive.Input
      data-slot="combobox-input"
      css={inputClass}
      className={className}
      {...props}
    />
  );
}

const iconClass = css`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  color: var(--muted-foreground);
  & svg {
    width: 1rem;
    height: 1rem;
  }
`;

export function ComboboxIcon({
  className,
  children,
  ...props
}: WithClassName<React.ComponentProps<typeof ComboboxPrimitive.Icon>>): React.ReactNode {
  return (
    <ComboboxPrimitive.Icon
      data-slot="combobox-icon"
      css={iconClass}
      className={className}
      {...props}
    >
      {children ?? <ChevronDownIcon />}
    </ComboboxPrimitive.Icon>
  );
}

const clearClass = css`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  padding: 0;
  color: var(--muted-foreground);
  cursor: pointer;
  &:hover {
    color: var(--foreground);
  }
  & svg {
    width: 0.875rem;
    height: 0.875rem;
  }
`;

export function ComboboxClear({
  className,
  children,
  ...props
}: WithClassName<React.ComponentProps<typeof ComboboxPrimitive.Clear>>): React.ReactNode {
  return (
    <ComboboxPrimitive.Clear
      data-slot="combobox-clear"
      css={clearClass}
      className={className}
      {...props}
    >
      {children ?? <XIcon />}
    </ComboboxPrimitive.Clear>
  );
}

const chipsClass = css`
  display: contents;
`;

export function ComboboxChips({
  className,
  ...props
}: WithClassName<React.ComponentProps<typeof ComboboxPrimitive.Chips>>): React.ReactNode {
  return (
    <ComboboxPrimitive.Chips
      data-slot="combobox-chips"
      css={chipsClass}
      className={className}
      {...props}
    />
  );
}

const chipClass = css`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  border-radius: 0.25rem;
  background-color: var(--muted);
  padding: 0.125rem 0.25rem 0.125rem 0.5rem;
  font-size: 0.8125rem;
  color: var(--foreground);
  &[data-highlighted] {
    outline: 2px solid var(--ring);
    outline-offset: 1px;
  }
  &[data-disabled] {
    opacity: 0.5;
  }
`;

export const ComboboxChip = React.forwardRef<
  HTMLDivElement,
  WithClassName<React.ComponentProps<typeof ComboboxPrimitive.Chip>>
>(function ComboboxChip({ className, ...props }, ref) {
  return (
    <ComboboxPrimitive.Chip
      ref={ref}
      data-slot="combobox-chip"
      css={chipClass}
      className={className}
      {...props}
    />
  );
});

const chipRemoveClass = css`
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  padding: 0;
  color: var(--muted-foreground);
  cursor: pointer;
  &:hover {
    color: var(--foreground);
  }
  & svg {
    width: 0.75rem;
    height: 0.75rem;
  }
`;

export function ComboboxChipRemove({
  className,
  children,
  ...props
}: WithClassName<React.ComponentProps<typeof ComboboxPrimitive.ChipRemove>>): React.ReactNode {
  return (
    <ComboboxPrimitive.ChipRemove
      data-slot="combobox-chip-remove"
      css={chipRemoveClass}
      className={className}
      {...props}
    >
      {children ?? <XIcon />}
    </ComboboxPrimitive.ChipRemove>
  );
}

export function ComboboxPortal(
  props: React.ComponentProps<typeof ComboboxPrimitive.Portal>,
): React.ReactNode {
  return <ComboboxPrimitive.Portal {...props} />;
}

type ComboboxPositionerProps = WithClassName<
  React.ComponentProps<typeof ComboboxPrimitive.Positioner>
>;

// The `Positioner` is `position: absolute` (or `fixed`) with `z-index: auto`,
// so despite `ComboboxPopup` below setting `z-index: 50` on itself, that
// value only wins against the Positioner's OWN siblings - it does nothing
// for stacking against unrelated trees elsewhere in the document. Per the
// CSS painting-order algorithm (CSS 2.1 Appendix E §6), a positioned
// descendant with `z-index: auto` is painted in the SAME step as any other
// `z-index: auto`/`0` stacking context in its nearest ancestor stacking
// context (here, the document root, since neither the Combobox's own portal
// container nor the app shell establishes one) - ordered by tree/DOM
// position, not visual nesting. A sibling `position: sticky` element with an
// explicit `z-index` anywhere else in the document (e.g. the richtext
// widget's sticky toolbar, `z-10`) creates its own such stacking context and
// can end up painted after (i.e. on top of) this one purely because of where
// it sits in the DOM, regardless of the popup's own z-index (DCMS-2138). An
// explicit z-index directly on the Positioner promotes the whole floating
// tree into the "positive z-index" painting step, which always wins over
// z-index:auto content irrespective of DOM order.
const positionerClass = css`
  z-index: 9999;
`;

export function ComboboxPositioner({
  className,
  ...props
}: ComboboxPositionerProps): React.ReactNode {
  return (
    <ComboboxPrimitive.Positioner
      data-slot="combobox-positioner"
      css={positionerClass}
      className={className}
      {...props}
    />
  );
}

const popupClass = css`
  position: relative;
  z-index: 50;
  max-height: var(--available-height);
  min-width: var(--anchor-width);
  overflow-x: hidden;
  overflow-y: auto;
  border-radius: 0.375rem;
  background-color: var(--popover);
  color: var(--popover-foreground);
  box-shadow: 0 4px 12px rgb(0 0 0 / 0.12);
  outline: 1px solid color-mix(in srgb, var(--foreground), transparent 90%);
  padding: 0.25rem;
`;

export function ComboboxPopup({
  className,
  ...props
}: WithClassName<React.ComponentProps<typeof ComboboxPrimitive.Popup>>): React.ReactNode {
  return (
    <ComboboxPrimitive.Popup
      data-slot="combobox-popup"
      css={popupClass}
      className={className}
      {...props}
    />
  );
}

const listClass = css`
  display: flex;
  flex-direction: column;
  outline: none;
`;

export function ComboboxList({
  className,
  ...props
}: WithClassName<React.ComponentProps<typeof ComboboxPrimitive.List>>): React.ReactNode {
  return (
    <ComboboxPrimitive.List
      data-slot="combobox-list"
      css={listClass}
      className={className}
      {...props}
    />
  );
}

const itemClass = css`
  position: relative;
  display: flex;
  width: 100%;
  cursor: default;
  align-items: center;
  gap: 0.5rem;
  border-radius: 0.125rem;
  padding: 0.375rem 2rem 0.375rem 0.5rem;
  font-size: 0.875rem;
  outline: none;
  user-select: none;
  &[data-highlighted] {
    background-color: var(--accent);
    color: var(--accent-foreground);
  }
  &[data-disabled] {
    pointer-events: none;
    opacity: 0.5;
  }
`;

const itemIndicatorClass = css`
  pointer-events: none;
  position: absolute;
  right: 0.5rem;
  display: flex;
  width: 1rem;
  height: 1rem;
  align-items: center;
  justify-content: center;
`;

// Lets the item's content shrink inside the flex row, so a long label can
// truncate instead of overflowing the popup.
const itemTextClass = css`
  min-width: 0;
`;

export function ComboboxItem({
  className,
  children,
  ...props
}: WithClassName<React.ComponentProps<typeof ComboboxPrimitive.Item>>): React.ReactNode {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      css={itemClass}
      className={className}
      {...props}
    >
      <span css={itemTextClass}>{children}</span>
      <span css={itemIndicatorClass}>
        <ComboboxPrimitive.ItemIndicator>
          <CheckIcon size={16} />
        </ComboboxPrimitive.ItemIndicator>
      </span>
    </ComboboxPrimitive.Item>
  );
}

const emptyClass = css`
  padding: 1.5rem 0;
  text-align: center;
  font-size: 0.875rem;
  color: var(--muted-foreground);
  /* Base UI keeps this element mounted while the list has items; without
     this its padding showed as a blank band above the options. */
  &:empty {
    padding: 0;
  }
`;

export function ComboboxEmpty({
  className,
  ...props
}: WithClassName<React.ComponentProps<typeof ComboboxPrimitive.Empty>>): React.ReactNode {
  return (
    <ComboboxPrimitive.Empty
      data-slot="combobox-empty"
      css={emptyClass}
      className={className}
      {...props}
    />
  );
}

const statusClass = css`
  padding: 0.375rem 0.5rem;
  font-size: 0.75rem;
  color: var(--muted-foreground);
  &:empty {
    padding: 0;
  }
`;

export function ComboboxStatus({
  className,
  ...props
}: WithClassName<React.ComponentProps<typeof ComboboxPrimitive.Status>>): React.ReactNode {
  return (
    <ComboboxPrimitive.Status
      data-slot="combobox-status"
      css={statusClass}
      className={className}
      {...props}
    />
  );
}

const groupClass = css`
  padding: 0.25rem;
`;

export function ComboboxGroup({
  className,
  ...props
}: WithClassName<React.ComponentProps<typeof ComboboxPrimitive.Group>>): React.ReactNode {
  return (
    <ComboboxPrimitive.Group
      data-slot="combobox-group"
      css={groupClass}
      className={className}
      {...props}
    />
  );
}

const groupLabelClass = css`
  padding: 0.375rem 0.5rem;
  font-size: 0.75rem;
  color: var(--muted-foreground);
`;

export function ComboboxGroupLabel({
  className,
  ...props
}: WithClassName<React.ComponentProps<typeof ComboboxPrimitive.GroupLabel>>): React.ReactNode {
  return (
    <ComboboxPrimitive.GroupLabel
      data-slot="combobox-group-label"
      css={groupLabelClass}
      className={className}
      {...props}
    />
  );
}

export function ComboboxCollection(
  props: React.ComponentProps<typeof ComboboxPrimitive.Collection>,
): React.ReactNode {
  return <ComboboxPrimitive.Collection {...props} />;
}
