import '../utils/dismiss-local-backup';
const errorColor = 'rgb(255, 0, 59)'; // '#ff003b';
const normalColor = 'rgb(223, 223, 227)';

describe('Editor UI Error Handling', () => {
  before(() => {
    Cypress.config('defaultCommandTimeout', 4000);
    cy.task('setupBackend', {backend: 'test'});
    cy.loginAndNewKitchenSink();
  });

  before(() => {
    cy.contains('button', 'Save').click();
  });

  after(() => {
    cy.task('teardownBackend', {backend: 'test'});
  });

  describe('After pressing save and there are validation errors', () => {
    it('shows label and border in red of non-nested/top-level field', () => {
      cy.get('label').contains('Title').should(($el) => {
        expect($el).to.have.css('background-color', errorColor);
      });
      cy.get('label').contains('Title').next().should(($el) => {
        expect($el).to.have.css('border-color', errorColor);
      });
    });

    it('shows red label/border on field and ancestor fields for object widget', () => {
      cy.get('label').contains('Object').should(($el) => {
        expect($el).to.have.css('background-color', errorColor);
      });
      cy.get('label').contains('Object').next().should(($el) => {
        expect($el).to.have.css('border-color', errorColor);
      });
    });

    it('shows red label/border on field and ancestor fields for list widget', () => {
      cy.get('label').contains('List').should(($el) => {
        expect($el).to.have.css('background-color', errorColor);
      });
      cy.get('label').contains('List').next().should(($el) => {
        expect($el).to.have.css('border-color', errorColor);
      });
    });

    it('shows red label/border on field and ancestor fields for deeply nested list widget', () => {
      cy.get('label').contains('List').should(($el) => {
        expect($el).to.have.css('background-color', errorColor);
      });
      cy.get('label').contains('List').next().should(($el) => {
        expect($el).to.have.css('border-color', errorColor);
      });
    });
  });
});
