import React from 'react';
import { mount } from 'cypress/react';
import { composeStories } from '@storybook/react';

import * as stories from '../Buttons.stories';

const { Default } = composeStories(stories);

describe('Button component', () => {
  it('renders children text', () => {
    mount(<Default />);

    cy.get('button').should('have.text', Default.args.children);
  });

  it('calls onClick', () => {
    const onClick = cy.spy(); // .as('onClick');

    mount(<Default onClick={onClick} />);

    cy.get('button').click();

    // cy.get('@onClick').should('have.been.called');
    expect(onClick).to.have.been.called;
  });
});
