import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { components } from 'react-select';
import AsyncSelect from 'react-select/async';
import debounce from 'lodash/debounce';
import find from 'lodash/find';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import last from 'lodash/last';
import uniqBy from 'lodash/uniqBy';
import { fromJS, List, Map } from 'immutable';
import { reactSelectStyles } from 'decap-cms-ui-default';
import { stringTemplate, validations } from 'decap-cms-lib-widgets';
import { FixedSizeList } from 'react-window';
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { v4 as uuid } from 'uuid';

import relationCache from './RelationCache';

function arrayMove(array, from, to) {
  const slicedArray = array.slice();
  slicedArray.splice(to < 0 ? array.length + to : to, 0, slicedArray.splice(from, 1)[0]);
  return slicedArray;
}

function MultiValue(props) {
  const { setNodeRef, transform, transition } = useSortable({
    id: props.data.data.id,
  });

  function onMouseDown(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const innerProps = { ...props.innerProps, onMouseDown };
  return (
    <div ref={setNodeRef} style={style}>
      <components.MultiValue {...props} innerProps={innerProps} />
    </div>
  );
}

function MultiValueLabel(props) {
  const { attributes, listeners } = useSortable({
    id: props.data.data.id,
  });

  return (
    <div {...attributes} {...listeners}>
      <components.MultiValueLabel {...props} />
    </div>
  );
}

function SortableSelect(props) {
  const { distance, value, onSortEnd, isMulti } = props;

  if (!isMulti) {
    return <AsyncSelect {...props} />;
  }

  const keys = Array.isArray(value) ? value.map(({ data }) => data.id) : [];

  const activationConstraint = { distance };
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint }),
    useSensor(TouchSensor, { activationConstraint }),
  );

  function handleSortEnd({ active, over }) {
    onSortEnd({
      oldIndex: keys.indexOf(active.id),
      newIndex: keys.indexOf(over.id),
    });
  }

  return (
    <DndContext
      modifiers={[restrictToParentElement]}
      collisionDetection={closestCenter}
      sensors={sensors}
      onDragEnd={handleSortEnd}
    >
      <SortableContext items={keys} strategy={horizontalListSortingStrategy}>
        <AsyncSelect {...props} />
      </SortableContext>
    </DndContext>
  );
}

function Option({ index, style, data }) {
  return <div style={style}>{data.options[index]}</div>;
}

function MenuList(props) {
  if (props.isLoading || props.options.length <= 0 || !Array.isArray(props.children)) {
    return props.children;
  }
  const rows = props.children;
  const itemSize = 30;
  return (
    <FixedSizeList
      style={{ width: '100%' }}
      width={300}
      height={Math.min(300, rows.length * itemSize + itemSize / 3)}
      itemCount={rows.length}
      itemSize={itemSize}
      itemData={{ options: rows }}
    >
      {Option}
    </FixedSizeList>
  );
}

function optionToString(option) {
  return option && option.value ? option.value : '';
}

function convertToOption(raw) {
  if (typeof raw === 'string') {
    return { label: raw, value: raw };
  }

  return Map.isMap(raw) ? raw.toJS() : raw;
}

function getSelectedOptions(value) {
  const selectedOptions = List.isList(value) ? value.toJS() : value;

  if (!selectedOptions || !Array.isArray(selectedOptions)) {
    return null;
  }

  return selectedOptions;
}

function uniqOptions(initial, current) {
  return uniqBy(initial.concat(current), o => o.value);
}

function getFieldArray(field) {
  if (!field) {
    return [];
  }

  return List.isList(field) ? field.toJS() : [field];
}

function getSelectedValue({ value, options, isMultiple }) {
  if (isMultiple) {
    const selectedOptions = getSelectedOptions(value);
    if (selectedOptions === null) {
      return null;
    }

    const selected = selectedOptions
      .map(i => options.find(o => o.value === (i.value || i)))
      .filter(Boolean)
      .map(convertToSortableOption);
    return selected;
  } else {
    return find(options, ['value', value]) || null;
  }
}

function convertToSortableOption(raw) {
  const option = convertToOption(raw);
  return {
    ...option,
    data: {
      ...option.data,
      id: uuid(),
    },
  };
}

export default class RelationControl extends React.Component {
  mounted = false;

  state = {
    initialOptions: [],
  };

  static propTypes = {
    onChange: PropTypes.func.isRequired,
    forID: PropTypes.string.isRequired,
    value: PropTypes.node,
    field: ImmutablePropTypes.map,
    query: PropTypes.func.isRequired,
    queryHits: PropTypes.array,
    classNameWrapper: PropTypes.string.isRequired,
    setActiveStyle: PropTypes.func.isRequired,
    setInactiveStyle: PropTypes.func.isRequired,
    locale: PropTypes.string,
  };

  isValid = () => {
    const { field, value, t } = this.props;
    const min = field.get('min');
    const max = field.get('max');

    if (!this.isMultiple()) {
      return { error: false };
    }

    const error = validations.validateMinMax(
      t,
      field.get('label', field.get('name')),
      value,
      min,
      max,
    );

    return error ? { error } : { error: false };
  };

  shouldComponentUpdate(nextProps) {
    return (
      this.props.value !== nextProps.value ||
      this.props.hasActiveStyle !== nextProps.hasActiveStyle ||
      this.props.queryHits !== nextProps.queryHits
    );
  }

  async componentDidMount() {
    // Manually validate PropTypes - React 19 breaking change
    PropTypes.checkPropTypes(RelationControl.propTypes, this.props, 'prop', 'RelationControl');

    this.mounted = true;
    const { value } = this.props;
    if (value && this.hasInitialValues(value)) {
      await this.loadInitialOptions();
    }
  }

  hasInitialValues(value) {
    if (this.isMultiple()) {
      const selectedOptions = getSelectedOptions(value);
      return selectedOptions && selectedOptions.length > 0;
    }
    return value && value !== '';
  }

  async loadInitialOptions() {
    const { field, query, forID, value } = this.props;
    const collection = field.get('collection');
    const searchFieldsArray = getFieldArray(field.get('search_fields'));
    const file = field.get('file');

    try {
      const result = await relationCache.getOptions(
        collection,
        searchFieldsArray,
        '', // empty term for initial load
        file,
        () => query(forID, collection, searchFieldsArray, '', file),
      );

      const hits = result.payload.hits || [];
      const options = this.parseHitOptions(hits);

      if (this.mounted) {
        this.setState({ initialOptions: options });

        // Call onChange with metadata for initial values
        if (value && this.hasInitialValues(value)) {
          this.triggerInitialOnChange(value, options);
        }
      }
    } catch (error) {
      console.error('Failed to load initial options:', error);
    }
  }

  triggerInitialOnChange(value, options) {
    const { onChange, field } = this.props;

    if (this.isMultiple()) {
      const selectedOptions = getSelectedOptions(value);
      if (selectedOptions && selectedOptions.length > 0) {
        const matchedOptions = selectedOptions
          .map(val => options.find(opt => opt.value === (val.value || val)))
          .filter(Boolean);

        if (matchedOptions.length > 0) {
          const metadata = {
            [field.get('name')]: {
              [field.get('collection')]: matchedOptions.reduce(
                (acc, option) => ({
                  ...acc,
                  [option.value]: option.data,
                }),
                {},
              ),
            },
          };
          onChange(value, metadata);
        }
      }
    } else {
      const matchedOption = options.find(opt => opt.value === value);
      if (matchedOption) {
        const metadata = {
          [field.get('name')]: {
            [field.get('collection')]: {
              [matchedOption.value]: matchedOption.data,
            },
          },
        };
        onChange(value, metadata);
      }
    }
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  onSortEnd =
    options =>
    ({ oldIndex, newIndex }) => {
      const { onChange, field } = this.props;
      const value = options.map(optionToString);
      const newValue = arrayMove(value, oldIndex, newIndex);
      const metadata =
        (!isEmpty(options) && {
          [field.get('name')]: {
            [field.get('collection')]: {
              [last(newValue)]: last(options).data,
            },
          },
        }) ||
        {};
      onChange(fromJS(newValue), metadata);
    };

  handleChange = selectedOption => {
    const { onChange, field } = this.props;

    if (this.isMultiple()) {
      const options = selectedOption;
      this.setState({ initialOptions: options.filter(Boolean) });
      const value = options.map(optionToString);
      const metadata =
        (!isEmpty(options) && {
          [field.get('name')]: {
            [field.get('collection')]: {
              [last(value)]: last(options).data,
            },
          },
        }) ||
        {};
      onChange(fromJS(value), metadata);
    } else {
      this.setState({ initialOptions: [selectedOption].filter(Boolean) });
      const value = optionToString(selectedOption);
      const metadata = selectedOption && {
        [field.get('name')]: {
          [field.get('collection')]: { [value]: selectedOption.data },
        },
      };
      onChange(value, metadata);
    }
  };

  parseNestedFields = (hit, field) => {
    const { locale } = this.props;
    const hitData =
      locale != null && hit.i18n != null && hit.i18n[locale] != null
        ? hit.i18n[locale].data
        : hit.data;
    const templateVars = stringTemplate.extractTemplateVars(field);
    // return non template fields as is
    if (templateVars.length <= 0) {
      return get(hitData, field);
    }
    const data = stringTemplate.addFileTemplateFields(hit.path, fromJS(hitData));
    const value = stringTemplate.compileStringTemplate(field, null, hit.slug, data);
    return value;
  };

  isMultiple() {
    return this.props.field.get('multiple', false);
  }

  parseHitOptions = hits => {
    const { field } = this.props;
    const valueField = field.get('value_field');
    const displayField = field.get('display_fields') || List([field.get('value_field')]);
    const filters = getFieldArray(field.get('filters'));

    const options = hits.reduce((acc, hit) => {
      if (
        filters.every(filter => {
          // check if the value for the (nested) filter field is in the filter values
          const fieldKeys = filter.field.split('.');
          let value = hit.data;
          for (let i = 0; i < fieldKeys.length; i++) {
            if (Object.prototype.hasOwnProperty.call(value, fieldKeys[i])) {
              value = value[fieldKeys[i]];
            } else {
              return false;
            }
          }
          return filter.values.includes(value);
        })
      ) {
        const valuesPaths = stringTemplate.expandPath({ data: hit.data, path: valueField });
        for (let i = 0; i < valuesPaths.length; i++) {
          const label = displayField
            .toJS()
            .map(key => {
              const displayPaths = stringTemplate.expandPath({ data: hit.data, path: key });
              return this.parseNestedFields(hit, displayPaths[i] || displayPaths[0]);
            })
            .join(' ');
          const value = this.parseNestedFields(hit, valuesPaths[i]);
          acc.push({ data: hit.data, value, label });
        }
      }

      return acc;
    }, []);

    return options;
  };

  loadOptions = debounce((term, callback) => {
    const { field, query, forID } = this.props;
    const collection = field.get('collection');
    const searchFieldsArray = getFieldArray(field.get('search_fields'));
    const file = field.get('file');

    relationCache
      .getOptions(collection, searchFieldsArray, term, file, () =>
        query(forID, collection, searchFieldsArray, term, file),
      )
      .then(result => {
        const hits = result.payload.hits || [];
        const options = this.parseHitOptions(hits);
        const optionsLength = field.get('options_length') || 20;
        const uniq = uniqOptions(this.state.initialOptions, options).slice(0, optionsLength);
        callback(uniq);
      })
      .catch(error => {
        console.error('Failed to load options:', error);
        callback([]);
      });
  }, 500);

  render() {
    const { value, field, forID, classNameWrapper, setActiveStyle, setInactiveStyle, queryHits } =
      this.props;
    const isMultiple = this.isMultiple();
    const isClearable = !field.get('required', true) || isMultiple;

    const queryOptions = this.parseHitOptions(queryHits);
    const options = uniqOptions(this.state.initialOptions, queryOptions);
    const selectedValue = getSelectedValue({
      options,
      value,
      isMultiple,
    });

    return (
      <SortableSelect
        useDragHandle
        onSortEnd={this.onSortEnd(selectedValue)}
        distance={4}
        // react-select props:
        components={{ MenuList, MultiValue, MultiValueLabel }}
        value={selectedValue}
        inputId={forID}
        cacheOptions
        defaultOptions
        loadOptions={this.loadOptions}
        onChange={this.handleChange}
        className={classNameWrapper}
        onFocus={setActiveStyle}
        onBlur={setInactiveStyle}
        styles={reactSelectStyles}
        isMulti={isMultiple}
        isClearable={isClearable}
        placeholder=""
      />
    );
  }
}
