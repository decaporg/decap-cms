const spanishOptions = [
  'Desayuno',
  'Aperitivo',
  'Postre',
  'Bebida',
  'Snack',
  'Acompanamiento',
];
const englishOptions = [
  'Breakfast',
  'Main Course',
  'Appetizer',
  'Dessert',
  'Drink',
  'Snack',
  'Side Dish',
];
// const defaultLocale = 'en';
let courseOptions = englishOptions;
const config = {
  config: {
    load_config_file: false,
    backend: {
      name: 'test-repo',
    },
    // local_backend: true,
    media_folder: 'public/img',
    collections: [
      {
        label: 'Test',
        name: 'test',
        folder: 'content/test',
        create: true,
        fields: [
          { label: 'Title', name: 'title', widget: 'string' },
          {
            label: 'Locale',
            name: 'locale',
            widget: 'select',
            options: ['en', 'es'],
            default: ['en'],
          },
          {
            label: 'Recipe Card - Course',
            name: 'recipecard.course',
            widget: 'select',
            options: courseOptions,
            required: false,
            secondaryOptions: [{fieldName: 'locale', op: 'eq', value: 'es', options: spanishOptions}],
          },
        ],
      },
    ],
  },
};
// window.CMS_CONFIGURATION = config;
CMS.init(config);
