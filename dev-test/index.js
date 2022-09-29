// Register all the things
window.CMS.registerBackend('git-gateway', window.CMS.GitGatewayBackend);
window.CMS.registerBackend('proxy', window.CMS.ProxyBackend);
window.CMS.registerBackend('test-repo', window.CMS.TestBackend);
window.CMS.registerWidget([
  window.CMS.StringWidget.Widget(),
  window.CMS.NumberWidget.Widget(),
  window.CMS.TextWidget.Widget(),
  window.CMS.ImageWidget.Widget(),
  window.CMS.FileWidget.Widget(),
  window.CMS.SelectWidget.Widget(),
  window.CMS.MarkdownWidget.Widget(),
  window.CMS.ListWidget.Widget(),
  window.CMS.ObjectWidget.Widget(),
  window.CMS.RelationWidget.Widget(),
  window.CMS.BooleanWidget.Widget(),
  window.CMS.DateTimeWidget.Widget(),
  window.CMS.ColorStringWidget.Widget(),
]);
window.CMS.registerEditorComponent(window.CMS.imageEditorComponent);
window.CMS.registerEditorComponent({
  id: 'code-block',
  label: 'Code Block',
  widget: 'code',
  type: 'code-block',
});
window.CMS.registerLocale('en', window.CMS.locales.en);

Object.keys(window.CMS.images).forEach(iconName => {
  window.CMS.registerIcon(iconName, window.h(window.CMS.Icon, { type: iconName }));
});

window.CMS.init({
  config: {
    backend: {
      name: 'test-repo',
    },
    site_url: 'https://example.com',
    media_folder: 'assets/uploads',
    publish_mode: 'editorial_workflow',
    collections: [
      {
        name: 'posts',
        label: 'Posts',
        label_singular: 'Post',
        description:
          'The description is a great place for tone setting, high level information, and editing guidelines that are specific to a collection.\n',
        folder: '_posts',
        slug: '{{year}}-{{month}}-{{day}}-{{slug}}',
        summary: '{{title}} -- {{year}}/{{month}}/{{day}}',
        sortable_fields: {
          fields: ['title', 'date'],
          default: {
            field: 'title'
          }
        },
        create: true,
        view_filters: [
          {
            label: 'Posts With Index',
            field: 'title',
            pattern: 'This is post #',
          },
          {
            label: 'Posts Without Index',
            field: 'title',
            pattern: 'front matter post',
          },
          {
            label: 'Drafts',
            field: 'draft',
            pattern: true,
          },
        ],
        view_groups: [
          {
            label: 'Year',
            field: 'date',
            pattern: '\\d{4}',
          },
          {
            label: 'Drafts',
            field: 'draft',
          },
        ],
        fields: [
          {
            label: 'Title',
            name: 'title',
            widget: 'string',
          },
          {
            label: 'Draft',
            name: 'draft',
            widget: 'boolean',
            default: false,
          },
          {
            label: 'Publish Date',
            name: 'date',
            widget: 'datetime',
            date_format: 'yyyy-MM-dd',
            time_format: 'HH:mm',
            format: 'yyyy-MM-dd HH:mm',
          },
          {
            label: 'Cover Image',
            name: 'image',
            widget: 'image',
            required: false,
          },
          {
            label: 'Body',
            name: 'body',
            widget: 'text',
            hint: 'Main content goes here.',
          },
        ],
      },
      {
        name: 'faq',
        label: 'FAQ',
        folder: '_faqs',
        create: true,
        fields: [
          {
            label: 'Question',
            name: 'title',
            widget: 'string',
          },
          {
            label: 'Answer',
            name: 'body',
            widget: 'text',
          },
          {
            name: 'posts',
            label: 'Posts',
            label_singular: 'Post',
            widget: 'list',
            summary: "{{fields.post | split('|', '$1')}}",
            fields: [
              {
                label: 'Related Post',
                name: 'post',
                widget: 'relationKitchenSinkPost',
                collection: 'posts',
                display_fields: ['title', 'date'],
                search_fields: ['title', 'body'],
                value_field: '{{title}}|{{date}}',
              }
            ]
          },
        ],
      },
      {
        name: 'settings',
        label: 'Settings',
        delete: false,
        editor: {
          preview: false,
        },
        files: [
          {
            name: 'general',
            label: 'Site Settings',
            file: '_data/settings.json',
            description: 'General Site Settings',
            fields: [
              {
                label: 'Number of posts on frontpage',
                name: 'front_limit',
                widget: 'number',
                min: 1,
                max: 10,
              },
              {
                label: 'Global title',
                name: 'site_title',
                widget: 'string',
              },
              {
                label: 'Post Settings',
                name: 'posts',
                widget: 'object',
                fields: [
                  {
                    label: 'Number of posts on frontpage',
                    name: 'front_limit',
                    widget: 'number',
                    min: 1,
                    max: 10,
                  },
                  {
                    label: 'Default Author',
                    name: 'author',
                    widget: 'string',
                  },
                  {
                    label: 'Default Thumbnail',
                    name: 'thumb',
                    widget: 'image',
                    required: false,
                  },
                ],
              },
            ],
          },
          {
            name: 'authors',
            label: 'Authors',
            file: '_data/authors.yml',
            description: 'Author descriptions',
            fields: [
              {
                name: 'authors',
                label: 'Authors',
                label_singular: 'Author',
                widget: 'list',
                fields: [
                  {
                    label: 'Name',
                    name: 'name',
                    widget: 'string',
                    hint: 'First and Last',
                  },
                  {
                    label: 'Description',
                    name: 'description',
                    widget: 'text',
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        name: 'kitchenSink',
        label: 'Kitchen Sink',
        folder: '_sink',
        create: true,
        fields: [
          {
            label: 'Related Post',
            name: 'post',
            widget: 'relationKitchenSinkPost',
            collection: 'posts',
            display_fields: ['title', 'date'],
            search_fields: ['title', 'body'],
            value_field: 'title',
          },
          {
            label: 'Title',
            name: 'title',
            widget: 'string',
          },
          {
            label: 'Boolean',
            name: 'boolean',
            widget: 'boolean',
            default: true,
          },
          {
            label: 'Map',
            name: 'map',
            widget: 'map',
          },
          {
            label: 'Text',
            name: 'text',
            widget: 'text',
            hint: 'Plain text, not markdown',
          },
          {
            label: 'Number',
            name: 'number',
            widget: 'number',
            hint: 'To infinity and beyond!',
          },
          {
            label: 'Markdown',
            name: 'markdown',
            widget: 'string',
          },
          {
            label: 'Datetime',
            name: 'datetime',
            widget: 'datetime',
          },
          {
            label: 'Date',
            name: 'date',
            widget: 'datetime',
          },
          {
            label: 'Color',
            name: 'color',
            widget: 'color',
          },
          {
            label: 'Color string editable and alpha enabled',
            name: 'colorEditable',
            widget: 'color',
            enableAlpha: true,
            allowInput: true,
          },
          {
            label: 'Image',
            name: 'image',
            widget: 'image',
          },
          {
            label: 'File',
            name: 'file',
            widget: 'file',
          },
          {
            label: 'Select',
            name: 'select',
            widget: 'select',
            options: ['a', 'b', 'c'],
          },
          {
            label: 'Select multiple',
            name: 'select_multiple',
            widget: 'select',
            options: ['a', 'b', 'c'],
            multiple: true,
          },
          {
            label: 'Select numeric',
            name: 'select_numeric',
            widget: 'select',
            options: [
              {
                label: 'One',
                value: 1,
              },
              {
                label: 'Two',
                value: 2,
              },
              {
                label: 'Three',
                value: 3,
              },
            ],
          },
          {
            label: 'Hidden',
            name: 'hidden',
            widget: 'hidden',
            default: 'hidden',
          },
          {
            label: 'Object',
            name: 'object',
            widget: 'object',
            collapsed: true,
            fields: [
              {
                label: 'Related Post',
                name: 'post',
                widget: 'relationKitchenSinkPost',
                collection: 'posts',
                search_fields: ['title', 'body'],
                value_field: 'title',
              },
              {
                label: 'String',
                name: 'string',
                widget: 'string',
              },
              {
                label: 'Boolean',
                name: 'boolean',
                widget: 'boolean',
                default: false,
              },
              {
                label: 'Text',
                name: 'text',
                widget: 'text',
              },
              {
                label: 'Number',
                name: 'number',
                widget: 'number',
              },
              {
                label: 'Markdown',
                name: 'markdown',
                widget: 'text',
              },
              {
                label: 'Datetime',
                name: 'datetime',
                widget: 'datetime',
              },
              {
                label: 'Date',
                name: 'date',
                widget: 'datetime',
              },
              {
                label: 'Image',
                name: 'image',
                widget: 'image',
              },
              {
                label: 'File',
                name: 'file',
                widget: 'file',
              },
              {
                label: 'Select',
                name: 'select',
                widget: 'select',
                options: ['a', 'b', 'c'],
              },
            ],
          },
          {
            label: 'List',
            name: 'list',
            widget: 'list',
            fields: [
              {
                label: 'String',
                name: 'string',
                widget: 'string',
              },
              {
                label: 'Boolean',
                name: 'boolean',
                widget: 'boolean',
              },
              {
                label: 'Text',
                name: 'text',
                widget: 'text',
              },
              {
                label: 'Number',
                name: 'number',
                widget: 'number',
              },
              {
                label: 'Markdown',
                name: 'markdown',
                widget: 'text',
              },
              {
                label: 'Datetime',
                name: 'datetime',
                widget: 'datetime',
              },
              {
                label: 'Date',
                name: 'date',
                widget: 'datetime',
              },
              {
                label: 'Image',
                name: 'image',
                widget: 'image',
              },
              {
                label: 'File',
                name: 'file',
                widget: 'file',
              },
              {
                label: 'Select',
                name: 'select',
                widget: 'select',
                options: ['a', 'b', 'c'],
              },
              {
                label: 'Object',
                name: 'object',
                widget: 'object',
                fields: [
                  {
                    label: 'String',
                    name: 'string',
                    widget: 'string',
                  },
                  {
                    label: 'Boolean',
                    name: 'boolean',
                    widget: 'boolean',
                  },
                  {
                    label: 'Text',
                    name: 'text',
                    widget: 'text',
                  },
                  {
                    label: 'Number',
                    name: 'number',
                    widget: 'number',
                  },
                  {
                    label: 'Markdown',
                    name: 'markdown',
                    widget: 'text',
                  },
                  {
                    label: 'Datetime',
                    name: 'datetime',
                    widget: 'datetime',
                  },
                  {
                    label: 'Date',
                    name: 'date',
                    widget: 'datetime',
                  },
                  {
                    label: 'Image',
                    name: 'image',
                    widget: 'image',
                  },
                  {
                    label: 'File',
                    name: 'file',
                    widget: 'file',
                  },
                  {
                    label: 'Select',
                    name: 'select',
                    widget: 'select',
                    options: ['a', 'b', 'c'],
                  },
                  {
                    label: 'List',
                    name: 'list',
                    widget: 'list',
                    fields: [
                      {
                        label: 'Related Post',
                        name: 'post',
                        widget: 'relationKitchenSinkPost',
                        collection: 'posts',
                        search_fields: ['title', 'body'],
                        value_field: 'title',
                      },
                      {
                        label: 'String',
                        name: 'string',
                        widget: 'string',
                      },
                      {
                        label: 'Boolean',
                        name: 'boolean',
                        widget: 'boolean',
                      },
                      {
                        label: 'Text',
                        name: 'text',
                        widget: 'text',
                      },
                      {
                        label: 'Number',
                        name: 'number',
                        widget: 'number',
                      },
                      {
                        label: 'Markdown',
                        name: 'markdown',
                        widget: 'text',
                      },
                      {
                        label: 'Datetime',
                        name: 'datetime',
                        widget: 'datetime',
                      },
                      {
                        label: 'Date',
                        name: 'date',
                        widget: 'datetime',
                      },
                      {
                        label: 'Image',
                        name: 'image',
                        widget: 'image',
                      },
                      {
                        label: 'File',
                        name: 'file',
                        widget: 'file',
                      },
                      {
                        label: 'Select',
                        name: 'select',
                        widget: 'select',
                        options: ['a', 'b', 'c'],
                      },
                      {
                        label: 'Hidden',
                        name: 'hidden',
                        widget: 'hidden',
                        default: 'hidden',
                      },
                      {
                        label: 'Object',
                        name: 'object',
                        widget: 'object',
                        fields: [
                          {
                            label: 'String',
                            name: 'string',
                            widget: 'string',
                          },
                          {
                            label: 'Boolean',
                            name: 'boolean',
                            widget: 'boolean',
                          },
                          {
                            label: 'Text',
                            name: 'text',
                            widget: 'text',
                          },
                          {
                            label: 'Number',
                            name: 'number',
                            widget: 'number',
                          },
                          {
                            label: 'Markdown',
                            name: 'markdown',
                            widget: 'text',
                          },
                          {
                            label: 'Datetime',
                            name: 'datetime',
                            widget: 'datetime',
                          },
                          {
                            label: 'Date',
                            name: 'date',
                            widget: 'datetime',
                          },
                          {
                            label: 'Image',
                            name: 'image',
                            widget: 'image',
                          },
                          {
                            label: 'File',
                            name: 'file',
                            widget: 'file',
                          },
                          {
                            label: 'Select',
                            name: 'select',
                            widget: 'select',
                            options: ['a', 'b', 'c'],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            label: 'Typed List',
            name: 'typed_list',
            widget: 'list',
            types: [
              {
                label: 'Type 1 Object',
                name: 'type_1_object',
                widget: 'object',
                fields: [
                  {
                    label: 'String',
                    name: 'string',
                    widget: 'string',
                  },
                  {
                    label: 'Boolean',
                    name: 'boolean',
                    widget: 'boolean',
                  },
                  {
                    label: 'Text',
                    name: 'text',
                    widget: 'text',
                  },
                ],
              },
              {
                label: 'Type 2 Object',
                name: 'type_2_object',
                widget: 'object',
                fields: [
                  {
                    label: 'Number',
                    name: 'number',
                    widget: 'number',
                  },
                  {
                    label: 'Select',
                    name: 'select',
                    widget: 'select',
                    options: ['a', 'b', 'c'],
                  },
                  {
                    label: 'Datetime',
                    name: 'datetime',
                    widget: 'datetime',
                  },
                  {
                    label: 'Markdown',
                    name: 'markdown',
                    widget: 'text',
                  },
                ],
              },
              {
                label: 'Type 3 Object',
                name: 'type_3_object',
                widget: 'object',
                fields: [
                  {
                    label: 'Date',
                    name: 'date',
                    widget: 'datetime',
                  },
                  {
                    label: 'Image',
                    name: 'image',
                    widget: 'image',
                  },
                  {
                    label: 'File',
                    name: 'file',
                    widget: 'file',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
});

const PostPreview = window.createClass({
  render: function () {
    var entry = this.props.entry;
    return window.h(
      'div',
      {},
      window.h(
        'div',
        { className: 'cover' },
        window.h('h1', {}, entry.getIn(['data', 'title'])),
        this.props.widgetFor('image'),
      ),
      window.h('p', {}, window.h('small', {}, 'Written ' + entry.getIn(['data', 'date']))),
      window.h('div', { className: 'text' }, this.props.widgetFor('body')),
    );
  },
});

const GeneralPreview = window.createClass({
  render: function () {
    const entry = this.props.entry;
    const title = entry.getIn(['data', 'site_title']);
    const posts = entry.getIn(['data', 'posts']);
    const thumb = posts && posts.get('thumb');

    return window.h(
      'div',
      {},
      window.h('h1', {}, title),
      window.h(
        'dl',
        {},
        window.h('dt', {}, 'Posts on Frontpage'),
        window.h('dd', {}, this.props.widgetsFor('posts').getIn(['widgets', 'front_limit']) || 0),

        window.h('dt', {}, 'Default Author'),
        window.h('dd', {}, this.props.widgetsFor('posts').getIn(['data', 'author']) || 'None'),

        window.h('dt', {}, 'Default Thumbnail'),
        window.h(
          'dd',
          {},
          thumb && window.h('img', { src: this.props.getAsset(thumb).toString() }),
        ),
      ),
    );
  },
});
const AuthorsPreview = window.createClass({
  render: function () {
    return window.h(
      'div',
      {},
      window.h('h1', {}, 'Authors'),
      this.props.widgetsFor('authors').map(function (author, index) {
        return window.h(
          'div',
          { key: index },
          window.h('hr', {}),
          window.h('strong', {}, author.getIn(['data', 'name'])),
          author.getIn(['widgets', 'description']),
        );
      }),
    );
  },
});

const RelationKitchenSinkPostPreview = window.createClass({
  render: function () {
    // When a post is selected from the relation field, all of it's data
    // will be available in the field's metadata nested under the collection
    // name, and then further nested under the value specified in `value_field`.
    // In this case, the post would be nested under "posts" and then under
    // the title of the selected post, since our `value_field` in the config
    // is "title".
    const { value, fieldsMetaData } = this.props;
    const post = fieldsMetaData && fieldsMetaData.getIn(['posts', value]);
    const style = { border: '2px solid #ccc', borderRadius: '8px', padding: '20px' };
    return post
      ? window.h(
          'div',
          { style: style },
          window.h('h2', {}, 'Related Post'),
          window.h('h3', {}, post.get('title')),
          window.h('img', { src: post.get('image') }),
          window.h('p', {}, post.get('body', '').slice(0, 100) + '...'),
        )
      : null;
  },
});

const previewStyles = `
  html,
  body {
    color: #444;
    font-size: 14px;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  }

  body {
    padding: 20px;
  }

  h1 {
    margin-top: 20px;
    color: #666;
    font-weight: bold;
    font-size: 32px;
  }

  img {
    max-width: 100%;
  }
`;

window.CMS.registerPreviewTemplate('posts', PostPreview);
window.CMS.registerPreviewTemplate('general', GeneralPreview);
window.CMS.registerPreviewTemplate('authors', AuthorsPreview);
window.CMS.registerPreviewStyle(previewStyles, { raw: true });
// Pass the name of a registered control to reuse with a new widget preview.
window.CMS.registerWidget('relationKitchenSinkPost', 'relation', RelationKitchenSinkPostPreview);
window.CMS.registerAdditionalLink('example', 'Example.com', 'https://example.com', 'page');
