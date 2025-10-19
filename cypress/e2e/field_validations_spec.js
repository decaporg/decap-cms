import '../utils/dismiss-local-backup';
import {
  login,
  validateObjectFieldsAndExit,
  validateNestedObjectFieldsAndExit,
  validateListFieldsAndExit,
  validateNestedListFieldsAndExit,
} from '../utils/steps';
import { setting1, setting2 } from '../utils/constants';

const nestedListConfig = {
  collections: [
    {},
    {},
    {
      name: 'settings',
      label: 'Settings',
      editor: { preview: false },
      files: [
        {},
        {},
        {
          name: 'hotel_locations',
          label: 'Hotel Locations',
          file: '_data/hotel_locations.yml',
          fields: [
            {
              label: 'Country',
              name: 'country',
              widget: 'string',
            },
            {
              label: 'Hotel Locations',
              name: 'hotel_locations',
              widget: 'list',
              fields: [
                {
                  label: 'Cities',
                  name: 'cities',
                  widget: 'list',
                  fields: [
                    {
                      label: 'City',
                      name: 'city',
                      widget: 'string',
                    },
                    {
                      label: 'Number of Hotels in City',
                      name: 'number_of_hotels_in_city',
                      widget: 'number',
                    },
                    {
                      label: 'City Locations',
                      name: 'city_locations',
                      widget: 'list',
                      fields: [
                        {
                          label: 'Hotel Name',
                          name: 'hotel_name',
                          widget: 'string',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

describe('Test Backend Editorial Workflow', () => {
  after(() => {
    cy.task('teardownBackend', { backend: 'test' });
  });

  before(() => {
    Cypress.config('defaultCommandTimeout', 4000);
  });

  beforeEach(() => {
    cy.task('setupBackend', { backend: 'test' });
  });

  it('can validate object fields', () => {
    login();
    validateObjectFieldsAndExit(setting1);
  });

  it('can validate fields nested in an object field', () => {
    login();
    validateNestedObjectFieldsAndExit(setting1);
  });

  it('can validate list fields', () => {
    login();
    validateListFieldsAndExit(setting2);
  });

  it('can validate deeply nested list fields', () => {
    cy.task('updateConfig', nestedListConfig);

    login();
    validateNestedListFieldsAndExit(setting2);
  });
});
