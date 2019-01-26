import React from 'react';
import PropTypes from 'prop-types';
import BaseOption from 'react-select/lib/components/Option';
import BaseSingleValue from 'react-select/lib/components/SingleValue';
import EntryLoader from 'netlify-cms-entry-loader/src';

// TODO: add support for setting custom identifier field #1543
// TODO: export a factory to create custom Option UI
const Option = ({ data = {}, ...props }) => <BaseOption {...props}>{data.title}</BaseOption>;
Option.propTypes = { data: PropTypes.object };

// TODO: add support for setting custom identifier field #1543
// TODO: export a factory to create custom Value UI
const ValueRenderer = props => (
  <EntryLoader {...props}>
    {({ isFetching, data, error }) => {
      if (isFetching) return '...';
      if (error) return error;
      return data.title || 'Unknown Entity';
    }}
  </EntryLoader>
);

ValueRenderer.propTypes = { ...EntryLoader.propTypes };

const MultiValueLabel = ({ children: entry, innerProps }) => (
  <div {...innerProps}>
    <ValueRenderer {...entry} />
  </div>
);

MultiValueLabel.propTypes = {
  children: PropTypes.object,
  innerProps: PropTypes.object,
};

const SingleValue = ({ children: entry, ...props }) => (
  <BaseSingleValue {...props}>
    <ValueRenderer {...entry} />
  </BaseSingleValue>
);

SingleValue.propTypes = { children: PropTypes.object };
const components = { SingleValue, MultiValueLabel, Option };

const entryMapper = ({ data, slug }) => ({ ...data, value: slug, type: 'option' });
const getOptionValue = option => option && (option.value || option.slug || option);
const getSlug = value => value && (value.value || value);

export { components, entryMapper, getSlug, getOptionValue };
