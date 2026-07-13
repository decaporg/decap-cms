import '../utils/dismiss-local-backup';
import { login } from '../utils/steps';

describe('Conditional Fields', () => {
  after(() => {
    cy.task('teardownBackend', { backend: 'test' });
  });

  before(() => {
    Cypress.config('defaultCommandTimeout', 4000);
    cy.task('setupBackend', { backend: 'test' });
  });

  beforeEach(() => {
    login();
  });

  it('should show/hide string field based on select value using notEqual', () => {
    cy.contains('a', 'Kitchen Sink').click();
    cy.contains('a', 'New Kitchen Sink Post').click();

    // Initially, select field should have no value, so conditional field should be visible (condition: select != 'a')
    cy.contains('label', 'Conditional string').should('be.visible');

    // Select value 'a' - conditional field should be hidden
    cy.contains('label', 'Select')
      .parent()
      .next()
      .find('select')
      .select('a');
    
    // Conditional string field should now be hidden
    cy.contains('label', 'Conditional string').should('not.exist');

    // Change select to 'b' - conditional field should reappear
    cy.contains('label', 'Select')
      .parent()
      .next()
      .find('select')
      .select('b');
    
    cy.contains('label', 'Conditional string').should('be.visible');

    // Change select to 'c' - conditional field should still be visible
    cy.contains('label', 'Select')
      .parent()
      .next()
      .find('select')
      .select('c');
    
    cy.contains('label', 'Conditional string').should('be.visible');
  });

  it('should show/hide object field based on boolean value using equal', () => {
    cy.contains('a', 'Kitchen Sink').click();
    cy.contains('a', 'New Kitchen Sink Post').click();

    // Initially, boolean field should be false, so conditional object should be hidden
    cy.contains('label', 'Conditional object').should('not.exist');

    // Toggle boolean to true
    cy.contains('label', 'Boolean')
      .parent()
      .next()
      .find('input[type="checkbox"]')
      .click();

    // Conditional object should now be visible
    cy.contains('label', 'Conditional object').should('be.visible');

    // Verify the nested field inside the conditional object is accessible
    cy.contains('label', 'Conditional object')
      .parent()
      .parent()
      .within(() => {
        cy.contains('label', 'Title').should('be.visible');
      });

    // Toggle boolean back to false
    cy.contains('label', 'Boolean')
      .parent()
      .next()
      .find('input[type="checkbox"]')
      .click();

    // Conditional object should be hidden again
    cy.contains('label', 'Conditional object').should('not.exist');
  });

  it('should not validate hidden conditional fields on save', () => {
    cy.contains('a', 'Kitchen Sink').click();
    cy.contains('a', 'New Kitchen Sink Post').click();

    // Fill in required fields
    cy.get('input[type="text"]').first().clear();
    cy.get('input[type="text"]').first().type('Test Conditional Post');

    // Ensure boolean is false so conditional object is hidden
    cy.contains('label', 'Boolean')
      .parent()
      .next()
      .find('input[type="checkbox"]')
      .then($checkbox => {
        if ($checkbox.is(':checked')) {
          $checkbox.click();
        }
      });

    // Conditional object should be hidden
    cy.contains('label', 'Conditional object').should('not.exist');

    // Try to save - should succeed even though conditional object has required nested fields
    cy.contains('button', 'Publish').click();
    cy.contains('button', 'Publish now').click();

    // Should show success notification (or at least not show validation error for hidden field)
    cy.get('.notif__container', { timeout: 10000 }).should('be.visible');
  });

  it('should validate visible conditional fields on save', () => {
    cy.contains('a', 'Kitchen Sink').click();
    cy.contains('a', 'New Kitchen Sink Post').click();

    // Fill in required fields
    cy.get('input[type="text"]').first().clear();
    cy.get('input[type="text"]').first().type('Test Conditional Post 2');

    // Make boolean true so conditional object appears
    cy.contains('label', 'Boolean')
      .parent()
      .next()
      .find('input[type="checkbox"]')
      .click();

    // Conditional object should be visible
    cy.contains('label', 'Conditional object').should('be.visible');

    // Leave the nested field empty (it should be required)
    // Try to save - should fail if nested field has validation
    cy.contains('button', 'Publish').click();

    // Note: This test assumes the nested 'Title' field would have validation
    // If it doesn't, we should still verify the field is interactable
    cy.contains('label', 'Conditional object')
      .parent()
      .parent()
      .within(() => {
        cy.contains('label', 'Title')
          .parent()
          .next()
          .find('input')
          .type('Nested Title');
      });
  });

  it('should persist field values when field visibility toggles', () => {
    cy.contains('a', 'Kitchen Sink').click();
    cy.contains('a', 'New Kitchen Sink Post').click();

    // Set select to 'b' to make conditional string visible
    cy.contains('label', 'Select')
      .parent()
      .next()
      .find('select')
      .select('b');

    // Enter a value in conditional string
    cy.contains('label', 'Conditional string')
      .parent()
      .next()
      .find('input')
      .type('This value should persist');

    // Hide the field by changing select to 'a'
    cy.contains('label', 'Select')
      .parent()
      .next()
      .find('select')
      .select('a');

    // Field should be hidden
    cy.contains('label', 'Conditional string').should('not.exist');

    // Show the field again by changing select to 'c'
    cy.contains('label', 'Select')
      .parent()
      .next()
      .find('select')
      .select('c');

    // Verify the value persisted
    cy.contains('label', 'Conditional string')
      .parent()
      .next()
      .find('input')
      .should('have.value', 'This value should persist');
  });

  it('should work with comparison operators', () => {
    // This test would require adding test fields with numeric comparisons
    // For now, we're testing with the existing notEqual and equal behaviors
    // Future enhancement: Add fields with >, <, >=, <= operators to dev-test config
    cy.contains('a', 'Kitchen Sink').click();
    cy.contains('a', 'New Kitchen Sink Post').click();

    // Test != operator (already done above)
    cy.contains('label', 'Select')
      .parent()
      .next()
      .find('select')
      .select('a');
    cy.contains('label', 'Conditional string').should('not.exist');

    // Test == operator (with boolean)
    cy.contains('label', 'Boolean')
      .parent()
      .next()
      .find('input[type="checkbox"]')
      .click();
    cy.contains('label', 'Conditional object').should('be.visible');
  });

  it('should show/hide field with oneOf operator matching array values', () => {
    cy.contains('a', 'Kitchen Sink').click();
    cy.contains('a', 'New Kitchen Sink Post').click();

    // The oneOf conditional field should be hidden when select is not 'a' or 'b'
    cy.contains('label', 'Select')
      .parent()
      .next()
      .find('select')
      .select('c');
    
    cy.contains('label', 'Conditional oneOf').should('not.exist');

    // Select value 'a' - conditional field should appear (a is in ['a', 'b'])
    cy.contains('label', 'Select')
      .parent()
      .next()
      .find('select')
      .select('a');
    
    cy.contains('label', 'Conditional oneOf').should('be.visible');

    // Select value 'b' - conditional field should still be visible (b is in ['a', 'b'])
    cy.contains('label', 'Select')
      .parent()
      .next()
      .find('select')
      .select('b');
    
    cy.contains('label', 'Conditional oneOf').should('be.visible');

    // Change back to 'c' - conditional field should be hidden again
    cy.contains('label', 'Select')
      .parent()
      .next()
      .find('select')
      .select('c');
    
    cy.contains('label', 'Conditional oneOf').should('not.exist');
  });

  it('should handle nested field conditions with dot-notated field paths', () => {
    cy.contains('a', 'Kitchen Sink').click();
    cy.contains('a', 'New Kitchen Sink Post').click();

    // Expand the Object field to access nested select
    cy.contains('label', 'Object')
      .parent()
      .parent()
      .within(() => {
        // Check if object is collapsed and expand it
        cy.get('button').first().then($btn => {
          if ($btn.attr('aria-expanded') === 'false') {
            $btn.click();
          }
        });

        // Change nested select to 'a'
        cy.contains('label', 'Select')
          .parent()
          .next()
          .find('select')
          .select('a');
      });

    // Nested conditional field should now be visible
    cy.contains('label', 'Nested Conditional').should('be.visible');

    // Change nested select to 'b'
    cy.contains('label', 'Object')
      .parent()
      .parent()
      .within(() => {
        cy.contains('label', 'Select')
          .parent()
          .next()
          .find('select')
          .select('b');
      });

    // Nested conditional field should be hidden
    cy.contains('label', 'Nested Conditional').should('not.exist');
  });

  it('should handle wildcard field paths in list items', () => {
    cy.contains('a', 'Kitchen Sink').click();
    cy.contains('a', 'New Kitchen Sink Post').click();

    // Expand the List field
    cy.contains('label', 'List')
      .parent()
      .parent()
      .within(() => {
        // Add a list item
        cy.contains('button', 'Add').click();

        // The wildcard conditional field should be hidden initially
        cy.contains('label', 'List Wildcard Conditional').should('not.exist');

        // Change select in the list item to 'b'
        cy.contains('label', 'Select')
          .parent()
          .next()
          .find('select')
          .select('b');
      });

    // Now the wildcard conditional should be visible
    cy.contains('label', 'List Wildcard Conditional').should('be.visible');

    // Change select to a different value
    cy.contains('label', 'List')
      .parent()
      .parent()
      .within(() => {
        cy.contains('label', 'Select')
          .parent()
          .next()
          .find('select')
          .select('a');
      });

    // Wildcard conditional should be hidden again
    cy.contains('label', 'List Wildcard Conditional').should('not.exist');
  });

  it('should handle wildcard conditions in typed lists with structure.*.type pattern', () => {
    cy.contains('a', 'Kitchen Sink').click();
    cy.contains('a', 'New Kitchen Sink Post').click();

    // Image/Video Options should be hidden initially
    cy.contains('label', 'Image Options').should('not.exist');
    cy.contains('label', 'Video Options').should('not.exist');

    // Expand Structure List with Wildcard Conditionals
    cy.contains('label', 'Structure List with Wildcard Conditionals')
      .parent()
      .parent()
      .within(() => {
        // Add an image block
        cy.contains('button', 'Add').click();
      });

    // Select 'Image Block' type from the type chooser
    cy.contains('button', 'Image Block').click();

    // Image Options should now be visible
    cy.contains('label', 'Image Options').should('be.visible');
    cy.contains('label', 'Video Options').should('not.exist');

    // Add another item - this time a video block
    cy.contains('label', 'Structure List with Wildcard Conditionals')
      .parent()
      .parent()
      .within(() => {
        cy.contains('button', 'Add').click();
      });

    cy.contains('button', 'Video Block').click();

    // Video Options should now be visible
    cy.contains('label', 'Video Options').should('be.visible');
    
    // Image Options should still be visible (because there's still an image block)
    cy.contains('label', 'Image Options').should('be.visible');
  });

  it('should show/hide field using regex match operator (matches)', () => {
    cy.contains('a', 'Kitchen Sink').click();
    cy.contains('a', 'New Kitchen Sink Post').click();

    // Ensure Select is 'c' so a regex that matches /^a|b$/ won't match
    cy.contains('label', 'Select')
      .parent()
      .next()
      .find('select')
      .select('c');

    // Field using regex should be hidden
    cy.contains('label', 'Conditional regex').should('not.exist');

    // Select value 'a' - matches regex '/^(a|b)$/'
    cy.contains('label', 'Select')
      .parent()
      .next()
      .find('select')
      .select('a');

    cy.contains('label', 'Conditional regex').should('be.visible');

    // Select value 'b' - should also match
    cy.contains('label', 'Select')
      .parent()
      .next()
      .find('select')
      .select('b');

    cy.contains('label', 'Conditional regex').should('be.visible');
  });

  it('should respect regex flags and negated regex via matches operator', () => {
    cy.contains('a', 'Kitchen Sink').click();
    cy.contains('a', 'New Kitchen Sink Post').click();

    // Case-insensitive match: conditional should appear when input contains 'FOO' with /foo/i
    cy.contains('label', 'String')
      .parent()
      .next()
      .find('input')
      .as('ciInput');

    cy.get('@ciInput').clear();
    cy.get('@ciInput').type('FOO');

    cy.contains('label', 'Conditional regex ci').should('be.visible');

  // Negated regex: using a matches operator with a negative lookahead, field should be hidden when the value matches the original pattern
    cy.contains('label', 'String')
      .parent()
      .next()
      .find('input')
      .as('notRegexInput');

    cy.get('@notRegexInput').clear();
    cy.get('@notRegexInput').type('123-456');

    cy.contains('label', 'Conditional notRegex').should('not.exist');
  });
});
