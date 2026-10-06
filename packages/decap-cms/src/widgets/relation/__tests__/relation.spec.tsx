vi.mock('react-window', () => {
  function FixedSizeList(props) {
    return props.itemData.options;
  }

  function List({ rowCount, rowProps, rowComponent: RowComponent }) {
    return Array.from(
      { length: rowCount || 0 },
      (_, index) => RowComponent({ index, style: {}, options: rowProps?.options || [] }),
    );
  }

  return {
    FixedSizeList,
    List,
  };
});

import { act, fireEvent, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import queryCore, { collectionTag } from '@/lib/util/queryCore';
import { DecapCmsWidgetRelation } from '@/widgets/relation';

beforeEach(() => {
  vi.clearAllMocks();
  // Relation options are cached by the shared query coordinator; drop them so
  // each test observes its own query calls.
  queryCore.clear();
});

const RelationControl = DecapCmsWidgetRelation.controlComponent;

const fieldConfig = {
  name: 'post',
  collection: 'posts',
  display_fields: ['title', 'slug'],
  search_fields: ['title', 'body'],
  value_field: 'title',
};

const quickAddFieldConfig = {
  name: 'post',
  collection: 'posts',
  display_fields: ['title', 'slug'],
  search_fields: ['title', 'body'],
  value_field: 'title',
  allow_quick_add: true,
};

// Target-collection config for the quick-add dialog (DCMS-2055): `title` is
// required with a human `label`; `slug` is optional and carries a `hint`.
// Threaded into `RelationControl` the same way `EditorControl.tsx` threads
// `config` down through `Widget.tsx`.
const postsCollectionConfig = {
  collections: [
    {
      name: 'posts',
      label: 'Posts',
      folder: 'posts',
      fields: [
        { name: 'title', label: 'Title', widget: 'string', required: true },
        { name: 'slug', label: 'Slug', widget: 'string', required: false, hint: 'Used in the URL' },
      ],
    },
  ],
};

// Target-collection config (DCMS-2059) where the `posts` collection
// explicitly disallows new entries (`create: false`) - the quick-add button
// must stay hidden even though the field itself opts in via
// `allow_quick_add`, matching README.md:31's `selectAllowNewEntries` gating.
const noCreateCollectionConfig = {
  collections: [
    {
      name: 'posts',
      label: 'Posts',
      folder: 'posts',
      create: false,
      fields: [{ name: 'title', label: 'Title', widget: 'string' }],
    },
  ],
};

const customizedOptionsLengthConfig = {
  name: 'post',
  collection: 'posts',
  display_fields: ['title', 'slug'],
  search_fields: ['title', 'body'],
  value_field: 'title',
  options_length: 10,
};

const deeplyNestedFieldConfig = {
  name: 'post',
  collection: 'posts',
  display_fields: ['title', 'slug', 'deeply.nested.post.field'],
  search_fields: ['deeply.nested.post.field'],
  value_field: 'title',
};

const nestedFieldConfig = {
  name: 'post',
  collection: 'posts',
  display_fields: ['title', 'slug', 'nested.field_1'],
  search_fields: ['nested.field_1', 'nested.field_2'],
  value_field: 'title',
};

const filterBooleanFieldConfig = {
  name: 'post',
  collection: 'posts',
  display_fields: ['title', 'slug'],
  search_fields: ['title', 'body'],
  value_field: 'title',
  filters: [
    {
      field: 'draft',
      values: [false],
    },
  ],
};

const filterStringFieldConfig = {
  name: 'post',
  collection: 'posts',
  display_fields: ['title', 'slug'],
  search_fields: ['title', 'body'],
  value_field: 'title',
  filters: [
    {
      field: 'title',
      values: ['Post # 1', 'Post # 2', 'Post # 7', 'Post # 9', 'Post # 15'],
    },
  ],
};

const filterIntegerFieldConfig = {
  name: 'post',
  collection: 'posts',
  display_fields: ['title', 'slug'],
  search_fields: ['title', 'body'],
  value_field: 'title',
  filters: [
    {
      field: 'num',
      values: [1, 5, 9],
    },
  ],
};

const multipleFiltersFieldConfig = {
  name: 'post',
  collection: 'posts',
  display_fields: ['title', 'slug'],
  search_fields: ['title', 'body'],
  value_field: 'title',
  filters: [
    {
      field: 'title',
      values: ['Post # 1', 'Post # 2', 'Post # 7', 'Post # 9', 'Post # 15'],
    },
    {
      field: 'draft',
      values: [true],
    },
  ],
};

const emptyFilterFieldConfig = {
  name: 'post',
  collection: 'posts',
  display_fields: ['title', 'slug'],
  search_fields: ['title', 'body'],
  value_field: 'title',
  filters: [
    {
      field: 'draft',
      values: [],
    },
  ],
};

const nestedFilterFieldConfig = {
  name: 'post',
  collection: 'posts',
  display_fields: ['title', 'slug'],
  search_fields: ['title', 'body'],
  value_field: 'title',
  filters: [
    {
      field: 'deeply.nested.post.field',
      values: ['Deeply nested field'],
    },
  ],
};

function generateHits(length) {
  const hits = Array.from({ length }, (val, idx) => {
    const title = `Post # ${idx + 1}`;
    const slug = `post-number-${idx + 1}`;
    const draft = idx % 2 === 0;
    const num = idx + 1;
    const path = `posts/${slug}.md`;
    return { collection: 'posts', data: { title, slug, draft, num }, slug, path };
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
    {
      collection: 'posts',
      data: { title: 'JSON post', slug: 'post-json', body: 'Body json' },
    },
  ];
}

const simpleFileCollectionHits = [{ data: { categories: ['category 1', 'category 2'] } }];

const nestedFileCollectionHits = [
  {
    data: {
      nested: {
        categories: [
          {
            name: 'category 1',
            id: 'cat1',
          },
          {
            name: 'category 2',
            id: 'cat2',
          },
        ],
      },
    },
  },
];

const numberFieldsHits = [
  {
    collection: 'posts',
    data: {
      title: 'post # 1',
      slug: 'post-1',
      index: 1,
    },
  },
  {
    collection: 'posts',
    data: {
      title: 'post # 2',
      slug: 'post-2',
      index: 2,
    },
  },
];
class RelationController extends React.Component {
  state = {
    value: this.props.value,
    queryHits: [],
  };

  mounted = false;

  componentDidMount() {
    this.mounted = true;
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  handleOnChange = vi.fn(value => {
    act(() => {
      this.setState({ ...this.state, value });
    });
  });

  setQueryHits = vi.fn(queryHits => {
    if (this.mounted) {
      act(() => {
        this.setState({ ...this.state, queryHits });
      });
    }
  });

  query = vi.fn((...args) => {
    const queryHits = generateHits(25);

    const [, collection, , term, file, optionsLength] = args;
    let hits = queryHits;
    if (collection === 'numbers_collection') {
      hits = numberFieldsHits;
    } else if (file === 'nested_file') {
      hits = nestedFileCollectionHits;
    } else if (file === 'simple_file') {
      hits = simpleFileCollectionHits;
    } else if (term === 'JSON post') {
      hits = [queryHits[queryHits.length - 1]];
    } else if (term === 'YAML' || term === 'YAML post') {
      hits = [queryHits[queryHits.length - 2]];
    } else if (term === 'Nested') {
      hits = [queryHits[queryHits.length - 3]];
    } else if (term === 'Deeply nested') {
      hits = [queryHits[queryHits.length - 4]];
    }

    hits = hits.slice(0, optionsLength);

    this.setQueryHits(hits);

    return Promise.resolve({ payload: { hits } });
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

function setup({ field, value, hasErrors, errorListId, onQuickCreateEntry, t, config }) {
  let renderArgs;
  const setActiveSpy = vi.fn();
  const setInactiveSpy = vi.fn();

  const helpers = render(
    <RelationController value={value}>
      {({ handleOnChange, value, query, queryHits, setQueryHits }) => {
        renderArgs = {
          value,
          onChangeSpy: handleOnChange,
          setQueryHitsSpy: setQueryHits,
          querySpy: query,
        };
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
            hasErrors={hasErrors}
            errorListId={errorListId}
            onQuickCreateEntry={onQuickCreateEntry}
            config={config}
            t={t}
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
    const field = fieldConfig;
    const { getAllByText, input } = setup({ field });
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    await waitFor(() => {
      expect(getAllByText(/^Post # (\d{1,2}) post-number-\1$/)).toHaveLength(20);
    });
  });

  it('should list the first 10 option hits on initial load', async () => {
    const field = customizedOptionsLengthConfig;
    const { getAllByText, input } = setup({ field });
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    await waitFor(() => {
      expect(getAllByText(/^Post # (\d{1,2}) post-number-\1$/)).toHaveLength(10);
    });
  });

  it('should update option list based on search term', async () => {
    const field = fieldConfig;
    const { getAllByText, input } = setup({ field });
    await userEvent.type(input, 'YAML');

    await waitFor(() => {
      expect(getAllByText('YAML post post-yaml')).toHaveLength(1);
    });
  });

  it('caches relation search results and invalidates them via queryCore.invalidateTags on entry save (DCMS-663)', async () => {
    const field = fieldConfig;
    const { getAllByText, input, querySpy } = setup({ field });
    const searchCallsFor = (term: string) => querySpy.mock.calls.filter((args: unknown[]) => args[3] === term).length;

    await userEvent.type(input, 'YAML');
    await waitFor(() => {
      expect(getAllByText('YAML post post-yaml')).toHaveLength(1);
    });
    expect(searchCallsFor('YAML')).toBe(1);

    // Same term again: served from the queryCore cache (RelationControl.tsx
    // calls queryCore.fetch(..., { tags: [collectionTag(collection)], keepValue: true })),
    // so the query function is not invoked a second time.
    await userEvent.clear(input);
    await userEvent.type(input, 'YAML');
    await waitFor(() => {
      expect(getAllByText('YAML post post-yaml')).toHaveLength(1);
    });
    expect(searchCallsFor('YAML')).toBe(1);

    // Simulate the invalidation an entry save performs (see
    // src/core/actions/entries.tsx and src/core/actions/editorialWorkflow.tsx,
    // which call queryCore.invalidateTags([collectionTag(collection.name), ...])).
    queryCore.invalidateTags([collectionTag('posts')]);

    await userEvent.clear(input);
    await userEvent.type(input, 'YAML');
    await waitFor(() => {
      expect(searchCallsFor('YAML')).toBe(2);
    });
  });

  it('should call onChange with correct selectedItem value and metadata', async () => {
    const field = fieldConfig;
    const { getByText, input, onChangeSpy } = setup({ field });
    const value = 'Post # 1';
    const label = 'Post # 1 post-number-1';
    const metadata = {
      post: {
        posts: { 'Post # 1': { title: 'Post # 1', draft: true, num: 1, slug: 'post-number-1' } },
      },
    };

    fireEvent.keyDown(input, { key: 'ArrowDown' });

    await waitFor(() => {
      fireEvent.click(getByText(label));
      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeSpy).toHaveBeenCalledWith(value, metadata);
    });
  });

  it('should update metadata for initial preview 1', async () => {
    const field = fieldConfig;
    const value = 'Post # 1';
    const { getByDisplayValue, onChangeSpy } = setup({ field, value });
    const label = 'Post # 1 post-number-1';
    const metadata = {
      post: {
        posts: { 'Post # 1': { title: 'Post # 1', draft: true, num: 1, slug: 'post-number-1' } },
      },
    };

    await waitFor(
      () => {
        expect(getByDisplayValue(label)).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    await waitFor(
      () => {
        expect(onChangeSpy).toHaveBeenCalledTimes(1);
        expect(onChangeSpy).toHaveBeenCalledWith(value, metadata);
      },
      { timeout: 3000 },
    );
  });

  it('should update option list based on nested search term', async () => {
    const field = nestedFieldConfig;
    const { getAllByText, input } = setup({ field });
    await userEvent.type(input, 'Nested');

    await waitFor(() => {
      expect(getAllByText('Nested post post-nested Nested field 1')).toHaveLength(1);
    });
  });

  it('should update option list based on deeply nested search term', async () => {
    const field = deeplyNestedFieldConfig;
    const { getAllByText, input } = setup({ field });
    await userEvent.type(input, 'Deeply nested');

    await waitFor(() => {
      expect(
        getAllByText('Deeply nested post post-deeply-nested Deeply nested field'),
      ).toHaveLength(1);
    });
  });

  it('should handle string templates', async () => {
    const stringTemplateConfig = {
      name: 'post',
      collection: 'posts',
      display_fields: ['{{slug}}', '{{filename}}', '{{extension}}'],
      search_fields: ['slug'],
      value_field: '{{slug}}',
    };

    const field = stringTemplateConfig;
    const { getByText, input, onChangeSpy } = setup({ field });
    const value = 'post-number-1';
    const label = 'post-number-1 post-number-1 md';
    const metadata = {
      post: {
        posts: {
          'post-number-1': { title: 'Post # 1', draft: true, num: 1, slug: 'post-number-1' },
        },
      },
    };

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    await waitFor(() => {
      fireEvent.click(getByText(label));
      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeSpy).toHaveBeenCalledWith(value, metadata);
    });
  });

  // DCMS-1458: README.md and schema.ts's `oneOf` both document `valueField`/
  // `searchFields` (camelCase) as an equally valid alternative to
  // `value_field`/`search_fields`, but RelationControl.tsx only read the
  // snake_case keys, so a camelCase-only config passed schema validation and
  // then silently returned no options/search results at runtime.
  it('resolves options and search results from a camelCase-only config (valueField/searchFields, DCMS-1458)', async () => {
    const camelCaseFieldConfig = {
      name: 'post',
      collection: 'posts',
      display_fields: ['title', 'slug'],
      searchFields: ['title', 'body'],
      valueField: 'title',
    };

    const field = camelCaseFieldConfig;
    const { getAllByText, getByText, input, onChangeSpy } = setup({ field });

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    await waitFor(() => {
      expect(getAllByText(/^Post # (\d{1,2}) post-number-\1$/)).toHaveLength(20);
    });

    await userEvent.type(input, 'YAML');
    await waitFor(() => {
      expect(getAllByText('YAML post post-yaml')).toHaveLength(1);
    });

    fireEvent.click(getByText('YAML post post-yaml'));
    expect(onChangeSpy).toHaveBeenCalledWith('YAML post', {
      post: {
        posts: { 'YAML post': { title: 'YAML post', slug: 'post-yaml', body: 'Body yaml' } },
      },
    });
  });

  it('resolves display fields and options length from a camelCase config (displayFields/optionsLength, DCMS-1903)', async () => {
    const camelCaseFieldConfig = {
      name: 'post',
      collection: 'posts',
      value_field: 'title',
      search_fields: ['title', 'body'],
      displayFields: ['title', 'slug'],
      optionsLength: 10,
    };

    const field = camelCaseFieldConfig;
    const { getAllByText, getByText, input, onChangeSpy } = setup({ field });

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    await waitFor(() => {
      expect(getAllByText(/^Post # (\d{1,2}) post-number-\1$/)).toHaveLength(10);
    });

    fireEvent.click(getByText('Post # 1 post-number-1'));
    expect(onChangeSpy).toHaveBeenCalledWith('Post # 1', {
      post: {
        posts: { 'Post # 1': { title: 'Post # 1', draft: true, num: 1, slug: 'post-number-1' } },
      },
    });
  });

  it('should default display_fields to value_field', async () => {
    const { display_fields: _d, ...fieldConfigWithoutDisplay } = fieldConfig;
    const field = fieldConfigWithoutDisplay;
    const { getAllByText, input } = setup({ field });
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    await waitFor(() => {
      expect(getAllByText(/^Post # (\d{1,2})$/)).toHaveLength(20);
    });
  });
  it('should keep number type of referenced field', async () => {
    const fieldConfig = {
      name: 'numbers',
      collection: 'numbers_collection',
      value_field: 'index',
      search_fields: ['index'],
      display_fields: ['title'],
    };

    const field = fieldConfig;
    const { getByText, getAllByText, input, onChangeSpy } = setup({ field });
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    await waitFor(() => {
      expect(getAllByText(/^post # \d$/)).toHaveLength(2);
    });

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.click(getByText('post # 1'));
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.click(getByText('post # 2'));

    expect(onChangeSpy).toHaveBeenCalledTimes(2);
    expect(onChangeSpy).toHaveBeenCalledWith(1, {
      numbers: { numbers_collection: { 1: { index: 1, slug: 'post-1', title: 'post # 1' } } },
    });
    expect(onChangeSpy).toHaveBeenCalledWith(2, {
      numbers: { numbers_collection: { 2: { index: 2, slug: 'post-2', title: 'post # 2' } } },
    });
  });

  it('lists search results ahead of the default options (decaporg #7968)', async () => {
    const field = fieldConfig;
    const { getAllByRole, input, querySpy } = setup({ field, value: 'Post # 1' });
    await waitFor(() => expect(querySpy).toHaveBeenCalled());

    // The input shows the selected label; type over it, as a user would.
    await userEvent.tripleClick(input);
    await userEvent.keyboard('YAML');

    await waitFor(() => {
      expect(getAllByRole('option')[0]).toHaveTextContent('YAML post post-yaml');
    });
  });

  describe('with multiple', () => {
    // decaporg #7968: with values already selected, the initial load kept
    // every default hit as an "initial option", and those were listed ahead
    // of the search results, so searching seemed to do nothing.
    it('lists search results first when values are already selected', async () => {
      const field = { ...fieldConfig, multiple: true };
      const { getAllByRole, input, querySpy } = setup({ field, value: ['Post # 1'] });
      await waitFor(() => expect(querySpy).toHaveBeenCalled());

      await userEvent.type(input, 'YAML');

      await waitFor(() => {
        expect(getAllByRole('option')[0]).toHaveTextContent('YAML post post-yaml');
      });
    });

    it('should call onChange with correct selectedItem value and metadata', async () => {
      const field = { ...fieldConfig, multiple: true };
      const { getByText, input, onChangeSpy } = setup({ field });
      const metadata1 = {
        post: {
          posts: { 'Post # 1': { title: 'Post # 1', draft: true, num: 1, slug: 'post-number-1' } },
        },
      };
      const metadata2 = {
        post: {
          posts: { 'Post # 2': { title: 'Post # 2', draft: false, num: 2, slug: 'post-number-2' } },
        },
      };

      fireEvent.keyDown(input, { key: 'ArrowDown' });
      await waitFor(() => {
        fireEvent.click(getByText('Post # 1 post-number-1'));
      });

      fireEvent.keyDown(input, { key: 'ArrowDown' });
      await waitFor(() => {
        fireEvent.click(getByText('Post # 2 post-number-2'));
      });

      expect(onChangeSpy).toHaveBeenCalledTimes(2);
      expect(onChangeSpy).toHaveBeenCalledWith(['Post # 1'], metadata1);
      expect(onChangeSpy).toHaveBeenCalledWith(['Post # 1', 'Post # 2'], metadata2);
    });

    it('should not throw on Backspace/ArrowLeft in an empty input on a new (unselected) entry (DCMS-1018)', async () => {
      const field = { ...fieldConfig, multiple: true };
      const { input } = setup({ field });
      input.focus();
      expect(() => {
        fireEvent.keyDown(input, { key: 'Backspace' });
        fireEvent.keyDown(input, { key: 'ArrowLeft' });
      }).not.toThrow();
    });

    it('should update metadata for initial preview 2', async () => {
      const field = { ...fieldConfig, multiple: true };
      const value = ['YAML post', 'JSON post'];
      const { getByText, onChangeSpy } = setup({ field, value });
      const metadata = {
        post: {
          posts: {
            'YAML post': { title: 'YAML post', slug: 'post-yaml', body: 'Body yaml' },
            'JSON post': { title: 'JSON post', slug: 'post-json', body: 'Body json' },
          },
        },
      };

      await waitFor(
        () => {
          expect(getByText('YAML post post-yaml')).toBeInTheDocument();
          expect(getByText('JSON post post-json')).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      await waitFor(
        () => {
          expect(onChangeSpy).toHaveBeenCalledTimes(1);
          expect(onChangeSpy).toHaveBeenCalledWith(value, metadata);
        },
        { timeout: 3000 },
      );
    });
  });

  describe('with file collection', () => {
    const fileFieldConfig = {
      name: 'categories',
      collection: 'file',
      file: 'simple_file',
      value_field: 'categories.*',
      display_fields: ['categories.*'],
    };

    it('should handle simple list', async () => {
      const field = fileFieldConfig;
      const { getAllByText, input, getByText } = setup({ field });
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      await waitFor(() => {
        expect(getAllByText(/category/)).toHaveLength(2);
        expect(getByText('category 1')).toBeInTheDocument();
        expect(getByText('category 2')).toBeInTheDocument();
      });
    });

    it('should handle nested list', async () => {
      const field = {
        ...fileFieldConfig,
        file: 'nested_file',
        value_field: 'nested.categories.*.id',
        display_fields: ['nested.categories.*.name'],
      };
      const { getAllByText, input, getByText } = setup({ field });
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      await waitFor(() => {
        expect(getAllByText(/category/)).toHaveLength(2);
        expect(getByText('category 1')).toBeInTheDocument();
        expect(getByText('category 2')).toBeInTheDocument();
      });
    });
  });

  describe('with filter', () => {
    it('should list the 10 option hits on initial load using a filter on boolean value', async () => {
      const field = filterBooleanFieldConfig;
      const { getAllByText, input } = setup({ field });
      const expectedOptions = [];
      for (let i = 2; i <= 25; i += 2) {
        expectedOptions.push(`Post # ${i} post-number-${i}`);
      }
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      await waitFor(() => {
        const displayedOptions = getAllByText(/^Post # (\d{1,2}) post-number-\1$/);
        expect(displayedOptions).toHaveLength(expectedOptions.length);
        for (let i = 0; i < expectedOptions.length; i++) {
          const expectedOption = expectedOptions[i];
          const optionFound = displayedOptions.some(
            option => option.textContent === expectedOption,
          );
          expect(optionFound).toBe(true);
        }
      });
    });

    it('should list the 5 option hits on initial load using a filter on string value', async () => {
      const field = filterStringFieldConfig;
      const { getAllByText, input } = setup({ field });
      const expectedOptions = [
        'Post # 1 post-number-1',
        'Post # 2 post-number-2',
        'Post # 7 post-number-7',
        'Post # 9 post-number-9',
        'Post # 15 post-number-15',
      ];
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      await waitFor(() => {
        const displayedOptions = getAllByText(/^Post # (\d{1,2}) post-number-\1$/);
        expect(displayedOptions).toHaveLength(expectedOptions.length);
        for (let i = 0; i < expectedOptions.length; i++) {
          const expectedOption = expectedOptions[i];
          const optionFound = displayedOptions.some(
            option => option.textContent === expectedOption,
          );
          expect(optionFound).toBe(true);
        }
      });
    });

    it('should list 3 option hits on initial load using a filter on integer value', async () => {
      const field = filterIntegerFieldConfig;
      const { getAllByText, input } = setup({ field });
      const expectedOptions = [
        'Post # 1 post-number-1',
        'Post # 5 post-number-5',
        'Post # 9 post-number-9',
      ];
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      await waitFor(() => {
        const displayedOptions = getAllByText(/^Post # (\d{1,2}) post-number-\1$/);
        expect(displayedOptions).toHaveLength(expectedOptions.length);
        for (let i = 0; i < expectedOptions.length; i++) {
          const expectedOption = expectedOptions[i];
          const optionFound = displayedOptions.some(
            option => option.textContent === expectedOption,
          );
          expect(optionFound).toBe(true);
        }
      });
    });

    it('should list 4 option hits on initial load using multiple filters', async () => {
      const field = multipleFiltersFieldConfig;
      const { getAllByText, input } = setup({ field });
      const expectedOptions = [
        'Post # 1 post-number-1',
        'Post # 7 post-number-7',
        'Post # 9 post-number-9',
        'Post # 15 post-number-15',
      ];
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      await waitFor(() => {
        const displayedOptions = getAllByText(/^Post # (\d{1,2}) post-number-\1$/);
        expect(displayedOptions).toHaveLength(expectedOptions.length);
        for (let i = 0; i < expectedOptions.length; i++) {
          const expectedOption = expectedOptions[i];
          const optionFound = displayedOptions.some(
            option => option.textContent === expectedOption,
          );
          expect(optionFound).toBe(true);
        }
      });
    });

    it('should list 0 option hits on initial load on empty filter values array', async () => {
      const field = emptyFilterFieldConfig;
      const { getAllByText, input } = setup({ field });
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      await waitFor(() => {
        expect(() => getAllByText(/^Post # (\d{1,2}) post-number-\1$/)).toThrow(Error);
      });
    });

    it('should list 1 option hit on initial load on nested filter field', async () => {
      const field = nestedFilterFieldConfig;
      const { getAllByText, input } = setup({ field });
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      await waitFor(() => {
        expect(() => getAllByText(/^Post # (\d{1,2}) post-number-\1$/)).toThrow(Error);
        expect(getAllByText('Deeply nested post post-deeply-nested')).toHaveLength(1);
      });
    });
  });

  // DCMS-1086: PR #1085 wired aria-invalid/aria-required/aria-errormessage
  // into string/text/number/colorstring/datetime/select/richtext, but missed
  // this combobox input, so the "focus first invalid control" heuristic
  // silently skipped past invalid relation fields.
  describe('RelationControl aria validation wiring (DCMS-1086)', () => {
    it('marks a required field as aria-required by default', () => {
      const { input } = setup({ field: fieldConfig });
      expect(input).toHaveAttribute('aria-required', 'true');
    });

    it('does not mark an explicitly optional field as aria-required', () => {
      const { input } = setup({ field: { ...fieldConfig, required: false } });
      expect(input).toHaveAttribute('aria-required', 'false');
    });

    it('has no aria-invalid when the field has no errors', () => {
      const { input } = setup({ field: fieldConfig });
      expect(input).not.toHaveAttribute('aria-invalid');
    });

    it('sets aria-invalid and aria-errormessage when the field has errors', () => {
      const { input } = setup({ field: fieldConfig, hasErrors: true, errorListId: 'post-field-1-errors' });
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-errormessage', 'post-field-1-errors');
    });

    it('sets aria-invalid on the chips input when the field is multiple', () => {
      const { container } = setup({
        field: { ...fieldConfig, multiple: true },
        hasErrors: true,
        errorListId: 'post-field-1-errors',
      });
      const input = container.querySelector('input');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-errormessage', 'post-field-1-errors');
    });
  });

  // Inline "create new entry from a relation field" (DCMS-1421): a
  // "+ Create new" affordance, opt-in per field via `allow_quick_add`, that
  // opens a minimal-fields form for the target collection and, on save,
  // creates the entry and selects it as this field's value.
  describe('RelationControl quick-add entry creation (DCMS-1421)', () => {
    it('does not render the quick-add button when allow_quick_add is unset', () => {
      const { queryByText } = setup({
        field: fieldConfig,
        onQuickCreateEntry: vi.fn(),
      });
      expect(queryByText(/Create new/i)).not.toBeInTheDocument();
    });

    it('does not render the quick-add button when no onQuickCreateEntry is wired up', () => {
      const { queryByText } = setup({ field: quickAddFieldConfig });
      expect(queryByText(/Create new/i)).not.toBeInTheDocument();
    });

    it('renders the quick-add button when both allow_quick_add and onQuickCreateEntry are set', () => {
      const { getByText } = setup({
        field: quickAddFieldConfig,
        onQuickCreateEntry: vi.fn(),
      });
      expect(getByText('+ Create new posts')).toBeInTheDocument();
    });

    // DCMS-2059: `allow_quick_add`/`onQuickCreateEntry` only cover the host
    // wiring side of the README.md:31 gate - the *target* collection must
    // also allow new entries, otherwise the button used to render and then
    // reject on save via `persistQuickCreateEntry`.
    it('does not render the quick-add button when the target collection disallows new entries', () => {
      const { queryByText } = setup({
        field: quickAddFieldConfig,
        onQuickCreateEntry: vi.fn(),
        config: noCreateCollectionConfig,
      });
      expect(queryByText(/Create new/i)).not.toBeInTheDocument();
    });

    it('opens a form with one input per value_field/display_fields field on click', async () => {
      const user = userEvent.setup();
      const { getByText, getByLabelText } = setup({
        field: quickAddFieldConfig,
        onQuickCreateEntry: vi.fn(),
      });

      await user.click(getByText('+ Create new posts'));

      expect(getByText('Create new posts')).toBeInTheDocument();
      expect(getByLabelText('title')).toBeInTheDocument();
      expect(getByLabelText('slug')).toBeInTheDocument();
    });

    it('closes the form without creating an entry on cancel', async () => {
      const user = userEvent.setup();
      const onQuickCreateEntry = vi.fn();
      const { getByText, queryByText } = setup({
        field: quickAddFieldConfig,
        onQuickCreateEntry,
      });

      await user.click(getByText('+ Create new posts'));
      await user.click(getByText('Cancel'));

      expect(queryByText('Create new posts')).not.toBeInTheDocument();
      expect(onQuickCreateEntry).not.toHaveBeenCalled();
    });

    it('creates the entry, selects it, and closes the form on save', async () => {
      const user = userEvent.setup();
      const created = { title: 'Quick post', slug: 'quick-post' };
      const onQuickCreateEntry = vi.fn().mockResolvedValue(created);
      const { getByText, getByLabelText, queryByText, onChangeSpy } = setup({
        field: quickAddFieldConfig,
        onQuickCreateEntry,
      });

      await user.click(getByText('+ Create new posts'));
      await user.type(getByLabelText('title'), 'Quick post');
      await user.type(getByLabelText('slug'), 'quick-post');
      await user.click(getByText('Save'));

      await waitFor(() => {
        expect(onQuickCreateEntry).toHaveBeenCalledWith('posts', {
          title: 'Quick post',
          slug: 'quick-post',
        });
      });
      await waitFor(() => {
        expect(queryByText('Create new posts')).not.toBeInTheDocument();
      });
      expect(onChangeSpy).toHaveBeenCalledWith(
        'Quick post',
        expect.objectContaining({
          post: { posts: { 'Quick post': created } },
        }),
      );
    });

    it('shows an error and keeps the form open when creation fails', async () => {
      const user = userEvent.setup();
      const onQuickCreateEntry = vi.fn().mockRejectedValue(
        new Error('Not allowed to create new entries in this collection'),
      );
      const { getByText, getByLabelText } = setup({
        field: quickAddFieldConfig,
        onQuickCreateEntry,
      });

      await user.click(getByText('+ Create new posts'));
      await user.type(getByLabelText('title'), 'Quick post');
      await user.click(getByText('Save'));

      await waitFor(() => {
        expect(getByText('Not allowed to create new entries in this collection')).toBeInTheDocument();
      });
      expect(getByText('Create new posts')).toBeInTheDocument();
    });

    // DCMS-2055: the quick-add dialog used to render each field's raw
    // `Object.keys(quickAdd.values)` key as its label (e.g. `title`), had no
    // required-field marker/validation, and lacked the hint/a11y wiring
    // (`hasErrors`/`errorListId`/`hintId`/`aria-describedby`/`aria-invalid`)
    // PR #2048 applied to `uuid`/`lucide-icon`/`radix-icon`.
    describe('a11y labels, required validation, and hint wiring (DCMS-2055)', () => {
      it("renders each field's label as the target collection field's label, not the raw field key", async () => {
        const user = userEvent.setup();
        const { getByText, getByLabelText, queryByLabelText } = setup({
          field: quickAddFieldConfig,
          onQuickCreateEntry: vi.fn(),
          config: postsCollectionConfig,
        });

        await user.click(getByText('+ Create new posts'));

        expect(getByLabelText(/^Title/)).toBeInTheDocument();
        expect(getByLabelText(/^Slug/)).toBeInTheDocument();
        expect(queryByLabelText('title')).not.toBeInTheDocument();
        expect(queryByLabelText('slug')).not.toBeInTheDocument();
      });

      it('blocks Save and shows an inline error when a required target field is left empty', async () => {
        const user = userEvent.setup();
        const onQuickCreateEntry = vi.fn().mockResolvedValue({ title: 'Quick post', slug: 'quick-post' });
        const { getByText, getByLabelText } = setup({
          field: quickAddFieldConfig,
          onQuickCreateEntry,
          config: postsCollectionConfig,
        });

        await user.click(getByText('+ Create new posts'));
        // `title` (required) left empty; only fill the optional `slug`.
        await user.type(getByLabelText(/^Slug/), 'quick-post');
        await user.click(getByText('Save'));

        await waitFor(() => {
          expect(getByText('Title is required.')).toBeInTheDocument();
        });
        expect(onQuickCreateEntry).not.toHaveBeenCalled();
        expect(getByText('Create new posts')).toBeInTheDocument();

        const titleInput = getByLabelText(/^Title/);
        expect(titleInput).toHaveAttribute('aria-invalid', 'true');

        // Filling the field in and re-submitting clears the inline error and
        // proceeds with the save.
        await user.type(titleInput, 'Quick post');
        await user.click(getByText('Save'));

        await waitFor(() => {
          expect(onQuickCreateEntry).toHaveBeenCalledWith('posts', {
            title: 'Quick post',
            slug: 'quick-post',
          });
        });
      });

      it('wires aria-describedby to the hint id when the target field defines a hint', async () => {
        const user = userEvent.setup();
        const { getByText, getByLabelText } = setup({
          field: quickAddFieldConfig,
          onQuickCreateEntry: vi.fn(),
          config: postsCollectionConfig,
        });

        await user.click(getByText('+ Create new posts'));

        const slugInput = getByLabelText(/^Slug/);
        const describedBy = slugInput.getAttribute('aria-describedby');
        expect(describedBy).toBeTruthy();
        expect(document.getElementById(describedBy).textContent).toBe('Used in the URL');

        // `title` has no configured hint, so it gets no aria-describedby.
        const titleInput = getByLabelText(/^Title/);
        expect(titleInput).not.toHaveAttribute('aria-describedby');
      });
    });
  });
});
