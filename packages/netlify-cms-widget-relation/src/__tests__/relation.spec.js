import React from 'react';
import { fromJS, Map } from 'immutable';
import { last } from 'lodash';
import { render, fireEvent, wait } from '@testing-library/react';
import { NetlifyCmsWidgetRelation } from '../';

const RelationControl = NetlifyCmsWidgetRelation.controlComponent;

const fieldConfig = {
  name: 'post',
  collection: 'posts',
  displayFields: ['title', 'slug'],
  searchFields: ['title', 'body'],
  valueField: 'title',
};

const customizedOptionsLengthConfig = {
  name: 'post',
  collection: 'posts',
  displayFields: ['title', 'slug'],
  searchFields: ['title', 'body'],
  valueField: 'title',
  optionsLength: 10,
};

const deeplyNestedFieldConfig = {
  name: 'post',
  collection: 'posts',
  displayFields: ['title', 'slug', 'deeply.nested.post.field'],
  searchFields: ['deeply.nested.post.field'],
  valueField: 'title',
};

const nestedFieldConfig = {
  name: 'post',
  collection: 'posts',
  displayFields: ['title', 'slug', 'nested.field_1'],
  searchFields: ['nested.field_1', 'nested.field_2'],
  valueField: 'title',
};

const generateHits = length => {
  const hits = Array.from({ length }, (val, idx) => {
    const title = `Post # ${idx + 1}`;
    const slug = `post-number-${idx + 1}`;
    const path = `posts/${slug}.md`;
    return { collection: 'posts', data: { title, slug }, slug, path };
  });

  return [
    ...hits,
    {
      collection: 'posts',
      data: {
        title: 'Deeply nested post',
        slug: 'post-deeply-nested',
        deeply: {
          nested: {
            post: {
              field: 'Deeply nested field',
            },
          },
        },
      },
    },
    {
      collection: 'posts',
      data: {
        title: 'Nested post',
        slug: 'post-nested',
        nested: {
          field_1: 'Nested field 1',
          field_2: 'Nested field 2',
        },
      },
    },
    {
      collection: 'posts',
      data: { title: 'YAML post', slug: 'post-yaml', body: 'Body yaml' },
    },
  ];
};

class RelationController extends React.Component {
  state = {
    value: this.props.value,
    queryHits: Map(),
  };

  handleOnChange = jest.fn(value => {
    this.setState({ ...this.state, value });
  });

  setQueryHits = jest.fn(hits => {
    const queryHits = Map().set('relation-field', hits);
    this.setState({ ...this.state, queryHits });
  });

  query = jest.fn((...args) => {
    const queryHits = generateHits(25);
    if (last(args) === 'YAML') {
      return Promise.resolve({ payload: { response: { hits: [last(queryHits)] } } });
    } else if (last(args) === 'Nested') {
      return Promise.resolve({
        payload: { response: { hits: [queryHits[queryHits.length - 2]] } },
      });
    } else if (last(args) === 'Deeply nested') {
      return Promise.resolve({
        payload: { response: { hits: [queryHits[queryHits.length - 3]] } },
      });
    }
    return Promise.resolve({ payload: { response: { hits: queryHits } } });
  });

  render() {
    return this.props.children({
      value: this.state.value,
      handleOnChange: this.handleOnChange,
      query: this.query,
      queryHits: this.state.queryHits,
      setQueryHits: this.setQueryHits,
    });
  }
}

function setup({ field, value }) {
  let renderArgs;
  const setActiveSpy = jest.fn();
  const setInactiveSpy = jest.fn();

  const helpers = render(
    <RelationController value={value}>
      {({ handleOnChange, value, query, queryHits, setQueryHits }) => {
        renderArgs = { value, onChangeSpy: handleOnChange, setQueryHitsSpy: setQueryHits };
        return (
          <RelationControl
            field={field}
            value={value}
            query={query}
            queryHits={queryHits}
            onChange={handleOnChange}
            forID="relation-field"
            classNameWrapper=""
            setActiveStyle={setActiveSpy}
            setInactiveStyle={setInactiveSpy}
          />
        );
      }}
    </RelationController>,
  );

  const input = helpers.container.querySelector('input');

  return {
    ...helpers,
    ...renderArgs,
    setActiveSpy,
    setInactiveSpy,
    input,
  };
}

describe('Relation widget', () => {
  it('should list the first 20 option hits on initial load', async () => {
    const field = fromJS(fieldConfig);
    const { getAllByText, input } = setup({ field });
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    await wait(() => {
      expect(getAllByText(/^Post # (\d{1,2}) post-number-\1$/)).toHaveLength(20);
    });
  });

  it('should list the first 10 option hits on initial load', async () => {
    const field = fromJS(customizedOptionsLengthConfig);
    const { getAllByText, input } = setup({ field });
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    await wait(() => {
      expect(getAllByText(/^Post # (\d{1,2}) post-number-\1$/)).toHaveLength(10);
    });
  });

  it('should update option list based on search term', async () => {
    const field = fromJS(fieldConfig);
    const { getAllByText, input } = setup({ field });
    fireEvent.change(input, { target: { value: 'YAML' } });

    await wait(() => {
      expect(getAllByText('YAML post post-yaml')).toHaveLength(1);
    });
  });

  it('should call onChange with correct selectedItem value and metadata', async () => {
    const field = fromJS(fieldConfig);
    const { getByText, input, onChangeSpy } = setup({ field });
    const value = 'Post # 1';
    const label = 'Post # 1 post-number-1';
    const metadata = {
      post: { posts: { 'Post # 1': { title: 'Post # 1', slug: 'post-number-1' } } },
    };

    await wait(() => {
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.click(getByText(label));
      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeSpy).toHaveBeenCalledWith(value, metadata);
    });
  });

  it('should update metadata for initial preview', async () => {
    const field = fromJS(fieldConfig);
    const value = 'Post # 1';
    const { getByText, onChangeSpy, setQueryHitsSpy } = setup({ field, value });
    const label = 'Post # 1 post-number-1';
    const metadata = {
      post: { posts: { 'Post # 1': { title: 'Post # 1', slug: 'post-number-1' } } },
    };

    setQueryHitsSpy(generateHits(1));

    await wait(() => {
      expect(getByText(label)).toBeInTheDocument();
      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeSpy).toHaveBeenCalledWith(value, metadata);
    });
  });

  it('should update option list based on nested search term', async () => {
    const field = fromJS(nestedFieldConfig);
    const { getAllByText, input } = setup({ field });
    fireEvent.change(input, { target: { value: 'Nested' } });

    await wait(() => {
      expect(getAllByText('Nested post post-nested Nested field 1')).toHaveLength(1);
    });
  });

  it('should update option list based on deeply nested search term', async () => {
    const field = fromJS(deeplyNestedFieldConfig);
    const { getAllByText, input } = setup({ field });
    fireEvent.change(input, { target: { value: 'Deeply nested' } });

    await wait(() => {
      expect(
        getAllByText('Deeply nested post post-deeply-nested Deeply nested field'),
      ).toHaveLength(1);
    });
  });

  it('should handle string templates', async () => {
    const stringTemplateConfig = {
      name: 'post',
      collection: 'posts',
      displayFields: ['{{slug}}', '{{filename}}', '{{extension}}'],
      searchFields: ['slug'],
      valueField: '{{slug}}',
    };

    const field = fromJS(stringTemplateConfig);
    const { getByText, input, onChangeSpy } = setup({ field });
    const value = 'post-number-1';
    const label = 'post-number-1 post-number-1 md';
    const metadata = {
      post: { posts: { 'post-number-1': { title: 'Post # 1', slug: 'post-number-1' } } },
    };

    await wait(() => {
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.click(getByText(label));
      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeSpy).toHaveBeenCalledWith(value, metadata);
    });
  });

  describe('with multiple', () => {
    it('should call onChange with correct selectedItem value and metadata', async () => {
      const field = fromJS({ ...fieldConfig, multiple: true });
      const { getByText, input, onChangeSpy } = setup({ field });
      const metadata1 = {
        post: { posts: { 'Post # 1': { title: 'Post # 1', slug: 'post-number-1' } } },
      };
      const metadata2 = {
        post: { posts: { 'Post # 2': { title: 'Post # 2', slug: 'post-number-2' } } },
      };

      await wait(() => {
        fireEvent.keyDown(input, { key: 'ArrowDown' });
        fireEvent.click(getByText('Post # 1 post-number-1'));
        fireEvent.keyDown(input, { key: 'ArrowDown' });
        fireEvent.click(getByText('Post # 2 post-number-2'));

        expect(onChangeSpy).toHaveBeenCalledTimes(2);
        expect(onChangeSpy).toHaveBeenCalledWith(fromJS(['Post # 1']), metadata1);
        expect(onChangeSpy).toHaveBeenCalledWith(fromJS(['Post # 1', 'Post # 2']), metadata2);
      });
    });

    it('should update metadata for initial preview', async () => {
      const field = fromJS({ ...fieldConfig, multiple: true });
      const value = fromJS(['Post # 1', 'Post # 2']);
      const { getByText, onChangeSpy, setQueryHitsSpy } = setup({ field, value });
      const metadata1 = {
        post: { posts: { 'Post # 1': { title: 'Post # 1', slug: 'post-number-1' } } },
      };
      const metadata2 = {
        post: { posts: { 'Post # 2': { title: 'Post # 2', slug: 'post-number-2' } } },
      };

      setQueryHitsSpy(generateHits(2));

      await wait(() => {
        expect(getByText('Post # 1 post-number-1')).toBeInTheDocument();
        expect(getByText('Post # 2 post-number-2')).toBeInTheDocument();

        expect(onChangeSpy).toHaveBeenCalledTimes(2);
        expect(onChangeSpy).toHaveBeenCalledWith(value, metadata1);
        expect(onChangeSpy).toHaveBeenCalledWith(value, metadata2);
      });
    });
  });
});
