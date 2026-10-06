import { Collapsible } from '@base-ui/react/collapsible';
import { ClassNames, css } from '@emotion/react';
import styled from '@emotion/styled';
import { get, isEmpty, isObject, memoize, omit, set, uniqueId } from 'lodash-es';
import React from 'react';

import { randomUUID } from '@/lib/util/index';
import { stringTemplate, validations } from '@/lib/widgets/index';
import {
  colors,
  FieldLabel,
  lengths,
  ListItemTopBar,
  ObjectWidgetTopBar,
  SortableArea,
  SortableHandle,
  SortableItem,
} from '@/ui/default/index';
import DecapCmsWidgetObject from '@/widgets/object/index';
import {
  getErrorMessageForTypedFieldAndValue,
  getTypedFieldForValue,
  resolveFieldKeyType,
  TYPES_KEY,
} from './typedListHelpers';

import type {
  CmsEntry,
  CmsField,
  CmsFieldBase,
  CmsFieldList,
  CmsFieldObject,
  TranslateFunction,
} from '@/lib/util/index';
import type { ComponentType } from 'react';

interface WidgetControlRef {
  props: { field: CmsFieldBase & CmsFieldList };
  validate?: () => void;
  focus?: (path: string) => void;
  innerWrappedControl?: {
    validate?: () => void,
  };
}

const ObjectControl = DecapCmsWidgetObject.controlComponent;

const ListItem = styled.div();

const StyledListItemTopBar = styled(ListItemTopBar)`
  background-color: ${colors.textFieldBorder};
`;

interface NestedObjectLabelProps {
  collapsed?: boolean;
  error?: boolean | undefined;
}

const NestedObjectLabel = styled.div<NestedObjectLabelProps>`
  display: ${(props: NestedObjectLabelProps) => (props.collapsed ? 'block' : 'none')};
  border-top: 0;
  color: ${(props: NestedObjectLabelProps) => (props.error ? colors.errorText : 'inherit')};
  background-color: ${colors.textFieldBorder};
  padding: 13px;
  border-radius: 0 0 ${lengths.borderRadius} ${lengths.borderRadius};
`;

const styleStrings = {
  objectWidgetTopBarContainer: `
    padding: ${lengths.objectWidgetTopBarContainerPadding};
  `,
};

const styles = {
  listControlItem: css`
    margin-top: 18px;

    &:first-of-type {
      margin-top: 26px;
    }
  `,
  listControlItemCollapsed: css`
    padding-bottom: 0;
  `,
  collapsiblePanel: css`
    &[hidden] {
      display: none;
    }
  `,
  collapsiblePanelAlwaysVisible: css`
    &[hidden] {
      display: block !important;
    }
  `,
};

interface SortableListProps {
  children: React.ReactNode;
  onSortEnd: (args: { oldIndex: number, newIndex: number }) => void;
}

function SortableList({ children, onSortEnd }: SortableListProps) {
  return (
    <div>
      <SortableArea onSortEnd={onSortEnd}>{children}</SortableArea>
    </div>
  );
}

interface SortableListItemProps {
  index: number;
  collapsed?: boolean;
  children: React.ReactNode;
  css?: unknown;
}

function SortableListItem(props: SortableListItemProps) {
  const { collapsed } = props;

  return (
    <SortableItem index={props.index} withHandle>
      {(ref, { isDragging, isOver }) => (
        <ListItem
          ref={ref}
          style={{
            opacity: isDragging ? 0.5 : undefined,
            boxShadow: isOver ? `0 0 0 2px ${colors.active}` : undefined,
          }}
          className="SortableListItem"
          css={[styles.listControlItem, collapsed && styles.listControlItemCollapsed]}
        >
          {props.children}
        </ListItem>
      )}
    </SortableItem>
  );
}

const valueTypes = {
  SINGLE: 'SINGLE',
  MULTIPLE: 'MULTIPLE',
  MIXED: 'MIXED',
};

function handleSummary(
  summary: string,
  entry: CmsEntry | undefined,
  label: string,
  item: Record<string, string>,
): string {
  set(item, 'fields.label', label);
  const data = stringTemplate.addFileTemplateFields(entry?.path ?? '', item);
  return stringTemplate.compileStringTemplate(summary, null, '', data);
}

function validateItem(field: CmsField, item: unknown): boolean {
  if (!isObject(item)) {
    console.warn(
      `'${field.name}' field item value value should be an object but is a '${typeof item}'`,
    );
    return false;
  }
  return true;
}

interface LabelComponentProps {
  field: CmsField;
  isActive: boolean;
  hasErrors: boolean | undefined;
  uniqueFieldId: string;
  isFieldOptional: boolean;
  t: TranslateFunction;
}

function LabelComponent({
  field,
  isActive,
  hasErrors,
  uniqueFieldId,
  isFieldOptional,
  t,
}: LabelComponentProps) {
  const label = `${field.label ?? field.name}`;
  return (
    <FieldLabel $isActive={isActive} $hasErrors={hasErrors} htmlFor={uniqueFieldId}>
      {label} {`${isFieldOptional ? ` (${t?.('editor.editorControl.field.optional') ?? ''})` : ''}`}
    </FieldLabel>
  );
}

interface TypeItem {
  name: string;
  label?: string;
}

export interface ListControlProps {
  metadata?: Record<string, Record<string, unknown>>;
  onChange: (value: unknown[], metadata?: Record<string, unknown>) => void;
  onChangeObject: (
    field: CmsField,
    newValue: unknown,
    newMetadata?: Record<string, unknown>,
  ) => void;
  onValidateObject: (
    fieldId: string | CmsField,
    errors: Array<{ type: string, message: string }>,
  ) => void;
  validate: () => void;
  value?: unknown[] | unknown;
  field: CmsFieldBase & CmsFieldList;
  forID: string;
  controlRef?: (ref: WidgetControlRef | null) => void;
  mediaPaths: Record<string, string>;
  getAsset: (
    path: string,
    field: CmsField,
  ) => { toString: () => string, url: string, path: string };
  onOpenMediaLibrary: (options: Record<string, unknown>) => void;
  onAddAsset: (asset: unknown) => void;
  onRemoveInsertedMedia: (controlID: string) => void;
  classNameWrapper: string;
  setActiveStyle: () => void;
  setInactiveStyle: () => void;
  editorControl: ComponentType<Record<string, unknown>>;
  resolveWidget: (name: string) => Record<string, unknown>;
  clearFieldErrors: (fieldId: string | undefined) => void;
  fieldsErrors: Record<string, Array<{ type: string, message: string, parentIds?: string[] }>>;
  /** Deprecated upstream (can contain stale data); fresh data comes from `getEntry`. */
  entry?: CmsEntry;
  getEntry?: () => CmsEntry | undefined;
  t: TranslateFunction;
  parentIds?: string[];
}

export interface ListControlHandle {
  validate(): void;
  focus(path: string): void;
}

type ChildRef = any;

function valueToString(value: unknown, fieldName: string): string {
  let stringValue;
  if (Array.isArray(value)) {
    stringValue = value.join(',');
  } else {
    console.warn(
      `Expected List value to be an array but received '${value}' with type of '${typeof value}'. Please check the value provided to the '${fieldName}' field`,
    );
    stringValue = String(value);
  }
  return stringValue.replace(/,([^\s]|$)/g, ', $1');
}

function getFieldsDefault(
  fields: any,
  initialValue: Record<string, unknown> = {},
): Record<string, unknown> {
  return fields.reduce((acc: Record<string, unknown>, item: any) => {
    const subfields = item.field || item.fields;
    const object = item.widget == 'object';
    const name = item.name;
    const defaultValue = item.default ?? null;

    if (Array.isArray(subfields) && object) {
      const subDefaultValue = getFieldsDefault(subfields);
      if (!isEmpty(subDefaultValue)) {
        acc[name] = subDefaultValue;
      }
      return acc;
    }

    if (isObject(subfields) && object) {
      const subDefaultValue = getFieldsDefault([subfields]);
      if (!isEmpty(subDefaultValue)) {
        acc[name] = subDefaultValue;
      }
      return acc;
    }

    if (defaultValue !== null) {
      acc[name] = defaultValue;
    }

    return acc;
  }, initialValue);
}

const ListControl = React.forwardRef<ListControlHandle, ListControlProps>(
  function ListControl(props, ref) {
    const {
      field,
      value: inputValue = [],
      forID,
      classNameWrapper,
      editorControl,
      onValidateObject,
      metadata,
      clearFieldErrors,
      fieldsErrors,
      controlRef,
      resolveWidget,
      parentIds = [],
      entry,
      getEntry,
      t,
      setActiveStyle,
      setInactiveStyle,
      onChange,
    } = props;

    const resolvedEntry = getEntry?.() ?? entry;

    const childRefs = React.useRef<Record<string, ChildRef>>({});
    const uniqueFieldIdRef = React.useRef<string>('');
    if (!uniqueFieldIdRef.current) {
      uniqueFieldIdRef.current = uniqueId(`${field.name}-field-`);
    }
    const uniqueFieldId = uniqueFieldIdRef.current;

    const initialArrayValue = Array.isArray(inputValue)
      ? inputValue
      : inputValue
      ? [inputValue]
      : [];
    const initialListCollapsed = field.collapsed ?? true;

    const [listCollapsed, setListCollapsed] = React.useState<boolean>(initialListCollapsed);
    const [itemsCollapsed, setItemsCollapsed] = React.useState<boolean[]>(
      () => initialArrayValue.map(() => initialListCollapsed) || [],
    );
    const [stringValue, setStringValue] = React.useState<string>(() => valueToString(initialArrayValue, field.name));
    const [keys, setKeys] = React.useState<string[]>(() => initialArrayValue.map(() => randomUUID()));

    function getValueType(): string | null {
      if (field.fields) return valueTypes.MULTIPLE;
      if (field.field) return valueTypes.SINGLE;
      if (field[TYPES_KEY]) return valueTypes.MIXED;
      return null;
    }

    function validateSize() {
      const value = Array.isArray(inputValue) ? inputValue : inputValue ? [inputValue] : [];
      const min = field.min;
      const max = field.max;
      const required = field.required ?? true;

      if (!required && !value?.length) {
        return [];
      }

      if (required && !value?.length) {
        return [
          {
            type: 'PRESENCE',
            message: t('editor.editorControlPane.widget.required', {
              fieldLabel: field.label ?? field.name,
            }),
          },
        ];
      }

      const error = validations.validateMinMax(
        t as (key: string, options: unknown) => string,
        field.label ?? field.name,
        value,
        min,
        max,
      );

      return error ? [error] : [];
    }

    // Latest state/props for the imperative handle so callers that captured the
    // handle once keep seeing the current value.
    const latestRef = React.useRef({
      inputValue,
      listCollapsed,
      itemsCollapsed,
      keys,
      propsValidate: props.validate,
      onValidateObject,
      forID,
      getValueType,
      validateSize,
    });
    latestRef.current = {
      inputValue,
      listCollapsed,
      itemsCollapsed,
      keys,
      propsValidate: props.validate,
      onValidateObject,
      forID,
      getValueType,
      validateSize,
    };

    // Pending focus for after a setState-triggered re-render expanded the items.
    const pendingFocusRef = React.useRef<{ index: number, remainingPath: string } | null>(null);

    React.useImperativeHandle(
      ref,
      () => ({
        validate() {
          const hasChildWidgets = latestRef.current.getValueType() && Object.keys(childRefs.current).length > 0;
          if (hasChildWidgets) {
            Object.values(childRefs.current).forEach((widget: ChildRef) => {
              widget?.validate?.();
            });
          } else {
            latestRef.current.propsValidate();
          }
          latestRef.current.onValidateObject(
            latestRef.current.forID,
            latestRef.current.validateSize(),
          );
        },
        focus(path: string) {
          const [indexStr, ...remainingPath] = path.split('.');
          const index = Number(indexStr);
          const { listCollapsed: lc, itemsCollapsed: ic, keys: ks } = latestRef.current;

          if (lc || ic[index]) {
            // Defer focus until after expansion renders.
            pendingFocusRef.current = { index, remainingPath: remainingPath.join('.') };
            setListCollapsed(false);
            setItemsCollapsed(prev => {
              const next = [...prev];
              next[index] = false;
              return next;
            });
          } else {
            const key = ks[index];
            const control = childRefs.current[key];
            control?.focus?.(remainingPath.join('.'));
          }
        },
      }),
      [],
    );

    // Apply pending focus after items expand.
    React.useEffect(() => {
      const pending = pendingFocusRef.current;
      if (!pending) return;
      if (listCollapsed || itemsCollapsed[pending.index]) return;
      pendingFocusRef.current = null;
      const key = keys[pending.index];
      const control = childRefs.current[key];
      control?.focus?.(pending.remainingPath);
    }, [listCollapsed, itemsCollapsed, keys]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const oldValue = stringValue;
      const newValue = e.target.value.trim();
      const listValue = newValue ? newValue.split(',') : [];
      if (newValue.match(/,$/) && oldValue.match(/, $/)) {
        listValue.pop();
      }

      const parsedValue = valueToString(listValue, field.name);
      setStringValue(parsedValue);
      onChange(listValue.map((val: string) => val.trim()));
    }

    function handleFocus() {
      setActiveStyle();
    }

    function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
      const listValue = e.target.value
        .split(',')
        .map((el: string) => el.trim())
        .filter((el: string) => el);
      setStringValue(valueToString(listValue, field.name));
      setInactiveStyle();
    }

    function singleDefault() {
      return get(field, ['field', 'default'], null);
    }

    function multipleDefault(fields: unknown) {
      return getFieldsDefault(fields);
    }

    function mixedDefault(typeKey: string, type: string) {
      const selectedType = (field[TYPES_KEY] as CmsField[]).find(
        (f: CmsField) => f.name === type,
      ) as CmsField & { fields?: CmsField[] | unknown, field?: CmsField | unknown };
      const fields = selectedType?.fields || [selectedType?.field];
      return getFieldsDefault(fields, { [typeKey]: type });
    }

    function addItem(parsedValue: unknown) {
      const addToTop = field.add_to_top ?? false;
      const itemKey = randomUUID();
      setItemsCollapsed(prev => (addToTop ? [false, ...prev] : [...prev, false]));
      setKeys(prev => (addToTop ? [itemKey, ...prev] : [...prev, itemKey]));

      const listValue = Array.isArray(inputValue) ? inputValue : inputValue ? [inputValue] : [];
      if (addToTop) {
        onChange([parsedValue, ...listValue]);
      } else {
        onChange([...listValue, parsedValue]);
      }
    }

    function handleAdd(e: React.MouseEvent) {
      e.preventDefault();
      const parsedValue = getValueType() === valueTypes.SINGLE ? singleDefault() : multipleDefault(field.fields);
      addItem(parsedValue);
    }

    function handleAddType(type: string, typeKey: string) {
      addItem(mixedDefault(typeKey, type));
    }

    function processControlRef(itemKey: string) {
      return (childRef: ChildRef) => {
        if (!childRef) return;
        childRefs.current[itemKey] = childRef;
      };
    }

    const handleChangeFor = React.useMemo(
      () =>
        memoize((index: number) => {
          const key = keys[index];

          return (f: CmsField, newValue: unknown, newMetadata: Record<string, unknown>) => {
            // Resolve the item's position, and read the list, when the change
            // fires rather than when this handler was created. An editor can
            // fire late with a handler from before an item was removed or
            // moved; `index` would then point at a different item (or past
            // the end), and the captured list would bring removed items back.
            const { inputValue: currentValue, keys: currentKeys } = latestRef.current;
            const currentIndex = currentKeys.indexOf(key);
            if (currentIndex === -1) {
              // The item this change belongs to has been removed.
              return;
            }

            const value = Array.isArray(currentValue)
              ? [...currentValue]
              : currentValue
              ? [currentValue]
              : [];
            const collectionName = field.name;
            const isListFieldObjectWidget = get(field, ['field', 'widget']) === 'object';
            const withNameKey = getValueType() !== valueTypes.SINGLE
              || (getValueType() === valueTypes.SINGLE && isListFieldObjectWidget);
            let newObjectValue;
            if (withNameKey) {
              const name = f.name;
              const ov = { ...((value[currentIndex] || {}) as Record<string, unknown>) };
              ov[name] = newValue;
              newObjectValue = ov;
            } else {
              newObjectValue = newValue;
            }
            const parsedMetadata = {
              [collectionName]: { ...(metadata ?? {}), ...(newMetadata || {}) },
            };

            value[currentIndex] = newObjectValue;
            onChange(value, parsedMetadata);
          };
        }),
      // Recreate when the items change so each new handler captures its
      // item's key; the value itself is read from `latestRef` at fire time.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [inputValue, keys, metadata, field, onChange],
    );

    function handleRemove(index: number, event: React.MouseEvent) {
      event.preventDefault();
      const collectionName = field.name;
      const isSingleField = getValueType() === valueTypes.SINGLE;
      const value = inputValue && Array.isArray(inputValue) ? inputValue : inputValue ? [inputValue] : [];

      const val = { ...value };
      const metadataRemovePath = isSingleField ? val[index] : Object.values(val[index]);
      const parsedMetadata = metadata && !isEmpty(metadata)
        ? {
          [collectionName]: omit(metadata, ...metadataRemovePath),
        }
        : metadata;

      const removedKey = keys[index];

      const newKeys = [...keys];
      newKeys.splice(index, 1);
      const newItemsCollapsed = [...itemsCollapsed];
      newItemsCollapsed.splice(index, 1);

      setItemsCollapsed(newItemsCollapsed);
      setKeys(newKeys);

      delete childRefs.current[removedKey];

      const newValue = value.filter((_: unknown, i: number) => i !== index);

      if (fieldsErrors) {
        Object.entries(fieldsErrors).forEach(([fieldId, errors]: [string, any]) => {
          if (errors.some((err: any) => err.parentIds?.includes(removedKey))) {
            clearFieldErrors(fieldId);
          }
        });
      }

      if (newValue.length === 0) {
        clearFieldErrors(forID);
        onValidateObject(forID, []);
      }

      onChange(newValue, parsedMetadata);
    }

    function handleItemCollapseToggle(index: number) {
      setItemsCollapsed(prev => prev.map((collapsed: boolean, i: number) => (i === index ? !collapsed : collapsed)));
    }

    function performCollapseAllToggle() {
      const value = inputValue && Array.isArray(inputValue) ? inputValue : inputValue ? [inputValue] : [];
      const minimizeCollapsedItems = field.minimize_collapsed ?? false;
      const listCollapsedByDefault = field.collapsed ?? true;
      const allItemsCollapsed = itemsCollapsed.every((val: boolean) => val === true);

      if (minimizeCollapsedItems) {
        let updatedItemsCollapsed = itemsCollapsed;
        if (!listCollapsed || !listCollapsedByDefault) {
          updatedItemsCollapsed = Array(value.length).fill(!listCollapsed);
        }
        setListCollapsed(prev => !prev);
        setItemsCollapsed(updatedItemsCollapsed);
      } else {
        setItemsCollapsed(Array(value.length).fill(!allItemsCollapsed));
      }
    }

    function handleCollapseAllToggle(e: React.MouseEvent) {
      e.preventDefault();
      performCollapseAllToggle();
    }

    function objectLabel(item: unknown) {
      const valueType = getValueType();
      switch (valueType) {
        case valueTypes.MIXED: {
          if (!validateItem(field, item)) return;
          const itemType = getTypedFieldForValue(field, item);
          const label = itemType?.label ?? itemType?.name ?? '';
          const summary = get(itemType, 'summary', field?.summary);
          return summary
            ? handleSummary(summary, resolvedEntry, label, item as Record<string, string>)
            : label;
        }
        case valueTypes.SINGLE: {
          const singleField = field.field;
          const label = singleField?.label ?? singleField?.name ?? '';
          const summary = field?.summary;
          const data = { [singleField?.name ?? '']: item as string };
          return summary ? handleSummary(summary, resolvedEntry, label, data) : label;
        }
        case valueTypes.MULTIPLE: {
          if (!validateItem(field, item)) return;
          const multiFields = field.fields;
          const labelField = multiFields && multiFields?.[0];
          const value = get(item, labelField?.name ?? '', '');
          const summary = field?.summary;
          const labelReturn = summary
            ? handleSummary(summary, resolvedEntry, value, item as Record<string, string>)
            : value;
          return (labelReturn || `No ${labelField?.name}`).toString();
        }
      }
      return '';
    }

    function onSortEnd({ oldIndex, newIndex }: { oldIndex: number, newIndex: number }) {
      const value = inputValue && Array.isArray(inputValue) ? inputValue : inputValue ? [inputValue] : [];

      const val = [...value];
      const item = val[oldIndex];
      val.splice(oldIndex, 1);
      val.splice(newIndex, 0, item);
      onChange(val);

      const collapsed = itemsCollapsed[oldIndex];
      const next = [...itemsCollapsed];
      next.splice(oldIndex, 1);
      const updatedItemsCollapsed = [...next];
      updatedItemsCollapsed.splice(newIndex, 0, collapsed);

      const movedKey = keys[oldIndex];
      const updatedKeys = [...keys];
      updatedKeys.splice(oldIndex, 1);
      updatedKeys.splice(newIndex, 0, movedKey);

      setItemsCollapsed(updatedItemsCollapsed);
      setKeys(updatedKeys);
    }

    function hasError(index: number) {
      if (fieldsErrors && !isEmpty(fieldsErrors)) {
        return Object.values(fieldsErrors).some((arr: any) =>
          arr.some((err: any) => err.parentIds && err.parentIds.includes(keys[index]))
        );
      }
    }

    const getStableParentIds = React.useMemo(
      () =>
        memoize(
          (parentIdsArr: string[], forIDArg: string | undefined, key: string) => [
            ...parentIdsArr,
            forIDArg ?? '',
            key,
          ],
          (parentIdsArr: string[], forIDArg: string | undefined, key: string) =>
            JSON.stringify([...parentIdsArr, forIDArg, key]),
        ),
      [],
    );

    function renderItem(item: unknown, index: number) {
      const collapsed = itemsCollapsed[index];
      const key = keys[index];
      let f: CmsField | undefined = field;
      const itemHasError = hasError(index);
      const isVariableTypesList = getValueType() === valueTypes.MIXED;
      if (isVariableTypesList) {
        f = getTypedFieldForValue(f!, item);
        if (!f) {
          return renderErroneousTypedItem(index, item);
        }
      }

      // Explicit, known panel id: Base UI's Collapsible.Trigger only emits
      // `aria-controls` when `open` is true (upstream gap, see DCMS-1725),
      // so we own the id and backfill `aria-controls` on the trigger
      // ourselves in ListItemTopBar regardless of state.
      const itemPanelId = `${key}-panel`;

      return (
        <SortableListItem
          css={[styles.listControlItem, collapsed && styles.listControlItemCollapsed]}
          index={index}
          key={key}
          collapsed={collapsed}
        >
          <Collapsible.Root open={!collapsed} onOpenChange={() => handleItemCollapseToggle(index)}>
            {isVariableTypesList && (
              <LabelComponent
                field={f!}
                isActive={false}
                hasErrors={itemHasError}
                uniqueFieldId={uniqueFieldId}
                isFieldOptional={f.required === false}
                t={t}
              />
            )}
            <StyledListItemTopBar
              collapsibleTrigger
              panelId={itemPanelId}
              collapsed={collapsed}
              dragHandle={SortableHandle}
              id={key}
              allowRemove={f!.allow_remove ?? true}
              allowReorder={f!.allow_reorder ?? true}
              onRemove={() => handleRemove(index, { preventDefault: () => {} } as React.MouseEvent)}
              data-testid={`styled-list-item-top-bar-${key}`}
            />
            <NestedObjectLabel
              className="NestedObjectLabel"
              collapsed={collapsed}
              error={itemHasError}
            >
              {objectLabel(item)}
            </NestedObjectLabel>
            <Collapsible.Panel id={itemPanelId} keepMounted css={styles.collapsiblePanel}>
              <ObjectControl
                classNameWrapper={classNameWrapper}
                value={item as Record<string, unknown>}
                field={f as CmsFieldObject & CmsFieldBase}
                onChangeObject={handleChangeFor(index) as (...args: unknown[]) => unknown}
                editorControl={editorControl}
                resolveWidget={resolveWidget}
                metadata={metadata}
                forList
                onValidateObject={onValidateObject}
                clearFieldErrors={clearFieldErrors}
                fieldsErrors={fieldsErrors}
                ref={processControlRef(key)}
                controlRef={controlRef as any}
                t={t}
                collapsed={collapsed}
                data-testid={`object-control-${key}`}
                hasError={itemHasError}
                parentIds={getStableParentIds(parentIds, forID, key)}
              />
            </Collapsible.Panel>
          </Collapsible.Root>
        </SortableListItem>
      );
    }

    function renderErroneousTypedItem(index: number, item: unknown) {
      const errorMessage = getErrorMessageForTypedFieldAndValue(
        field,
        item as Record<string, unknown>,
      );
      const key = `item-${index}`;
      return (
        <SortableListItem
          css={[styles.listControlItem, styles.listControlItemCollapsed]}
          index={index}
          key={key}
          collapsed
        >
          <StyledListItemTopBar
            onCollapseToggle={undefined}
            onRemove={() => handleRemove(index, { preventDefault: () => {} } as React.MouseEvent)}
            dragHandle={SortableHandle}
            id={key}
          />
          <NestedObjectLabel className="NestedObjectLabel" collapsed={true} error={true}>
            {errorMessage}
          </NestedObjectLabel>
        </SortableListItem>
      );
    }

    function renderListControl() {
      const value = inputValue && Array.isArray(inputValue) ? inputValue : inputValue ? [inputValue] : [];
      const items = value || [];
      const label = field.label ?? field.name;
      const labelSingular = field.label_singular ?? field.label ?? field.name;
      const listLabel = items.length === 1 ? labelSingular.toLowerCase() : label.toLowerCase();
      const minimizeCollapsedItems = field.minimize_collapsed ?? false;
      const allItemsCollapsed = itemsCollapsed.every((val: boolean) => val === true);
      const selfCollapsed = allItemsCollapsed && (listCollapsed || !minimizeCollapsedItems);

      // Explicit, known panel id: Base UI's Collapsible.Trigger only emits
      // `aria-controls` when `open` is true (upstream gap, see DCMS-1725),
      // so we own the id and backfill `aria-controls` on the trigger
      // ourselves in ObjectWidgetTopBar regardless of state.
      const listPanelId = `${forID}-panel`;

      return (
        <ClassNames>
          {({ cx, css: cn }) => (
            <Collapsible.Root
              id={forID}
              className={cx(
                classNameWrapper,
                cn`
                ${styleStrings.objectWidgetTopBarContainer}
              `,
              )}
              open={!selfCollapsed}
              onOpenChange={() => performCollapseAllToggle()}
            >
              <ObjectWidgetTopBar
                allowAdd={field.allow_add ?? true}
                onAdd={() => handleAdd({ preventDefault: () => {} } as React.MouseEvent)}
                types={field[TYPES_KEY] as unknown as TypeItem[]}
                onAddType={(type: string) => handleAddType(type, resolveFieldKeyType(field))}
                heading={`${items.length} ${listLabel}`}
                label={labelSingular.toLowerCase()}
                collapsibleTrigger
                panelId={listPanelId}
                collapsed={selfCollapsed}
                t={t!}
              />
              {
                /*
                 * Always render the panel (even when its contents are
                 * skipped below for perf) so the trigger's `aria-controls`
                 * set above never dangles: it must reference an id that
                 * actually exists in the DOM (DCMS-1725).
                 */
              }
              <Collapsible.Panel
                id={listPanelId}
                keepMounted
                css={minimizeCollapsedItems
                  ? styles.collapsiblePanel
                  : styles.collapsiblePanelAlwaysVisible}
              >
                {(!selfCollapsed || !minimizeCollapsedItems) && (
                  <SortableList onSortEnd={onSortEnd}>{items.map(renderItem)}</SortableList>
                )}
              </Collapsible.Panel>
            </Collapsible.Root>
          )}
        </ClassNames>
      );
    }

    function renderInput() {
      return (
        <input
          type="text"
          id={forID}
          value={stringValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={classNameWrapper}
        />
      );
    }

    if (getValueType() !== null) {
      return renderListControl();
    }
    return renderInput();
  },
);

export default ListControl;
