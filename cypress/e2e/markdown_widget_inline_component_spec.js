describe('Markdown widget inline component', () => {
  it('loads the post entry and tests the Wikilink inline editor component full round-trip', () => {
    cy.visit('/#/collections/posts/entries/2026-08-16-post-number-20');

    // Click Login on test-repo login screen
    cy.get('button').contains('Login').click();

    // Wait for the CMS editor to load
    cy.get('[data-slate-editor="true"]', { timeout: 15000 }).should('exist');

    // Stub prompt window
    cy.window().then(win => {
      cy.stub(win, 'prompt').callsFake(() => 'MyWikiPage');
    });

    // Focus the Markdown editor
    cy.get('[data-slate-editor="true"]').last().click();

    // Click the last "Add Component" toolbar button (on the Markdown widget)
    cy.get('button[title="Add Component"]').last().click({ force: true });

    // Click the "Wikilink" option in the dropdown
    cy.contains('Wikilink').click({ force: true });

    // Verify the preview element is rendered in the Slate Markdown editor
    cy.get('[data-slate-editor="true"]').last().should('contain', 'MyWikiPage');

    // Toggle to Markdown raw mode using switch
    cy.get('button[role="switch"]').last().click();

    // Verify raw editor contains the serialized [[MyWikiPage]]
    cy.get('[data-slate-editor="true"]').last().should('contain', '[[MyWikiPage]]');

    // Toggle back to Rich Text mode
    cy.get('button[role="switch"]').last().click();
    cy.get('[data-slate-editor="true"]').last().should('contain', 'MyWikiPage');
  });
});
