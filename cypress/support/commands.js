// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })
const { escapeRegExp } = require('../utils/regexp');
const path = require('path');

const matchRoute = (route, fetchArgs) => {
  const url = fetchArgs[0];
  const options = fetchArgs[1];

  const method = options && options.method ? options.method : 'GET';
  const body = options && options.body;

  // use pattern matching for the timestamp parameter
  const urlRegex = escapeRegExp(decodeURIComponent(route.url)).replace(
    /ts=\d{1,15}/,
    'ts=\\d{1,15}',
  );

  return (
    method === route.method &&
    body === route.body &&
    decodeURIComponent(url).match(new RegExp(`${urlRegex}`))
  );
};

const stubFetch = (win, routes) => {
  const fetch = win.fetch;
  cy.stub(win, 'fetch').callsFake((...args) => {
    const routeIndex = routes.findIndex(r => matchRoute(r, args));
    if (routeIndex >= 0) {
      const route = routes.splice(routeIndex, 1)[0];
      console.log(`matched ${args[0]} to ${route.url} ${route.method} ${route.status}`);

      const response = {
        status: route.status,
        headers: new Headers(route.headers),
        text: () => Promise.resolve(route.response),
        json: () => Promise.resolve(JSON.parse(route.response)),
        ok: route.status >= 200 && route.status <= 299,
      };
      return Promise.resolve(response);
    } else if (args[0].includes('api.github.com')) {
      console.warn(
        `No route match for github api request. Fetch args: ${JSON.stringify(args)}. Returning 404`,
      );
      const response = {
        status: 404,
        headers: new Headers(),
        text: () => Promise.resolve('{}'),
        json: () => Promise.resolve({}),
        ok: false,
      };
      return Promise.resolve(response);
    } else {
      console.log(`No route match for fetch args: ${JSON.stringify(args)}`);
      return fetch(...args);
    }
  });
};

Cypress.Commands.add('stubFetch', ({ fixture }) => {
  return cy.readFile(path.join('cypress', 'fixtures', fixture), { log: false }).then(routes => {
    cy.on('window:before:load', win => stubFetch(win, routes));
  });
});
