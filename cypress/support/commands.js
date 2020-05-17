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
import path from 'path';
import rehype from 'rehype';
import visit from 'unist-util-visit';
import { oneLineTrim } from 'common-tags';
import { escapeRegExp } from '../utils/regexp';

const matchRoute = (route, fetchArgs) => {
  const url = fetchArgs[0];
  const options = fetchArgs[1];

  const method = options && options.method ? options.method : 'GET';
  let body = options && options.body;
  let routeBody = route.body;

  let bodyMatch = false;
  if (routeBody?.encoding === 'base64' && ['File', 'Blob'].includes(body?.constructor.name)) {
    const blob = new Blob([Buffer.from(routeBody.content, 'base64')], {
      type: routeBody.contentType,
    });
    // size matching is good enough
    bodyMatch = blob.size === body.size;
  } else if (routeBody && body?.constructor.name === 'FormData') {
    bodyMatch = Array.from(body.entries()).some(([key, value]) => {
      const val = typeof value === 'string' ? value : '';
      const match = routeBody.includes(key) && routeBody.includes(val);
      return match;
    });
  } else {
    bodyMatch = body === routeBody;
  }

  // use pattern matching for the timestamp parameter
  const urlRegex = escapeRegExp(decodeURIComponent(route.url)).replace(
    /ts=\d{1,15}/,
    'ts=\\d{1,15}',
  );

  return (
    method === route.method && bodyMatch && decodeURIComponent(url).match(new RegExp(`${urlRegex}`))
  );
};

const stubFetch = (win, routes) => {
  const fetch = win.fetch;
  cy.stub(win, 'fetch').callsFake((...args) => {
    let routeIndex = routes.findIndex(r => matchRoute(r, args));
    if (routeIndex >= 0) {
      let route = routes.splice(routeIndex, 1)[0];
      const message = `matched ${args[0]} to ${route.url} ${route.method} ${route.status}`;
      console.log(message);
      if (route.status === 302) {
        console.log(`resolving redirect to ${route.headers.Location}`);
        routeIndex = routes.findIndex(r => matchRoute(r, [route.headers.Location]));
        route = routes.splice(routeIndex, 1)[0];
      }

      let blob;
      if (route.response && route.response.encoding === 'base64') {
        const buffer = Buffer.from(route.response.content, 'base64');
        blob = new Blob([buffer]);
      } else {
        blob = new Blob([route.response || '']);
      }
      const fetchResponse = {
        status: route.status,
        headers: new Headers(route.headers),
        blob: () => Promise.resolve(blob),
        text: () => Promise.resolve(route.response),
        json: () => Promise.resolve(JSON.parse(route.response)),
        ok: route.status >= 200 && route.status <= 299,
      };
      return Promise.resolve(fetchResponse);
    } else if (
      args[0].includes('api.github.com') ||
      args[0].includes('api.bitbucket.org') ||
      args[0].includes('bitbucket.org') ||
      args[0].includes('api.media.atlassian.com') ||
      args[0].includes('gitlab.com') ||
      args[0].includes('netlify.com') ||
      args[0].includes('s3.amazonaws.com')
    ) {
      console.warn(
        `No route match for api request. Fetch args: ${JSON.stringify(args)}. Returning 404`,
      );
      const fetchResponse = {
        status: 404,
        headers: new Headers(),
        blob: () => Promise.resolve(new Blob(['{}'])),
        text: () => Promise.resolve('{}'),
        json: () => Promise.resolve({}),
        ok: false,
      };
      return Promise.resolve(fetchResponse);
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

function runTimes(cyInstance, fn, count = 1) {
  let chain = cyInstance,
    i = count;
  while (i) {
    i -= 1;
    chain = fn(chain);
  }
  return chain;
}

[
  'enter',
  'backspace',
  ['selectAll', 'selectall'],
  ['up', 'upArrow'],
  ['down', 'downArrow'],
  ['left', 'leftArrow'],
  ['right', 'rightArrow'],
].forEach(key => {
  const [cmd, keyName] = typeof key === 'object' ? key : [key, key];
  Cypress.Commands.add(cmd, { prevSubject: true }, (subject, { shift, times = 1 } = {}) => {
    const fn = chain => chain.type(`${shift ? '{shift}' : ''}{${keyName}}`);
    return runTimes(cy.wrap(subject), fn, times);
  });
});

// Convert `tab` command from plugin to a child command with `times` support
Cypress.Commands.add('tabkey', { prevSubject: true }, (subject, { shift, times } = {}) => {
  const fn = chain => chain.tab({ shift });
  return runTimes(cy, fn, times).wrap(subject);
});

Cypress.Commands.add('selection', { prevSubject: true }, (subject, fn) => {
  cy.wrap(subject)
    .trigger('mousedown')
    .then(fn)
    .trigger('mouseup');

  cy.document().trigger('selectionchange');
  return cy.wrap(subject);
});

Cypress.Commands.add('print', { prevSubject: 'optional' }, (subject, str) => {
  cy.log(str);
  console.log(`cy.log: ${str}`);
  return cy.wrap(subject);
});

Cypress.Commands.add('setSelection', { prevSubject: true }, (subject, query, endQuery) => {
  return cy.wrap(subject).selection($el => {
    if (typeof query === 'string') {
      const anchorNode = getTextNode($el[0], query);
      const focusNode = endQuery ? getTextNode($el[0], endQuery) : anchorNode;
      const anchorOffset = anchorNode.wholeText.indexOf(query);
      const focusOffset = endQuery
        ? focusNode.wholeText.indexOf(endQuery) + endQuery.length
        : anchorOffset + query.length;
      setBaseAndExtent(anchorNode, anchorOffset, focusNode, focusOffset);
    } else if (typeof query === 'object') {
      const el = $el[0];
      const anchorNode = getTextNode(el.querySelector(query.anchorQuery));
      const anchorOffset = query.anchorOffset || 0;
      const focusNode = query.focusQuery
        ? getTextNode(el.querySelector(query.focusQuery))
        : anchorNode;
      const focusOffset = query.focusOffset || 0;
      setBaseAndExtent(anchorNode, anchorOffset, focusNode, focusOffset);
    }
  });
});

Cypress.Commands.add('setCursor', { prevSubject: true }, (subject, query, atStart) => {
  return cy.wrap(subject).selection($el => {
    const node = getTextNode($el[0], query);
    const offset = node.wholeText.indexOf(query) + (atStart ? 0 : query.length);
    const document = node.ownerDocument;
    document.getSelection().removeAllRanges();
    document.getSelection().collapse(node, offset);
  });
});

Cypress.Commands.add('setCursorBefore', { prevSubject: true }, (subject, query) => {
  cy.wrap(subject).setCursor(query, true);
});

Cypress.Commands.add('setCursorAfter', { prevSubject: true }, (subject, query) => {
  cy.wrap(subject).setCursor(query);
});

Cypress.Commands.add('login', () => {
  cy.viewport(1200, 1200);
  cy.visit('/');
  cy.contains('button', 'Login').click();
});

Cypress.Commands.add('loginAndNewPost', () => {
  cy.login();
  cy.contains('a', 'New Post').click();
});

Cypress.Commands.add('drag', { prevSubject: true }, subject => {
  return cy.wrap(subject).trigger('dragstart', {
    dataTransfer: {},
    force: true,
  });
});

Cypress.Commands.add('drop', { prevSubject: true }, subject => {
  return cy.wrap(subject).trigger('drop', {
    dataTransfer: {},
    force: true,
  });
});

Cypress.Commands.add('clickToolbarButton', (title, { times } = {}) => {
  const isHeading = title.startsWith('Heading');
  if (isHeading) {
    cy.get('button[title="Headings"]').click();
  }
  const instance = isHeading ? cy.contains('div', title) : cy.get(`button[title="${title}"]`);
  const fn = chain => chain.click();
  return runTimes(instance, fn, times).focused();
});

Cypress.Commands.add('insertEditorComponent', title => {
  cy.get('button[title="Add Component"]').click();
  cy.contains('div', title)
    .click()
    .focused();
});

[
  ['clickHeadingOneButton', 'Heading 1'],
  ['clickHeadingTwoButton', 'Heading 2'],
  ['clickOrderedListButton', 'Numbered List'],
  ['clickUnorderedListButton', 'Bulleted List'],
  ['clickCodeButton', 'Code'],
  ['clickItalicButton', 'Italic'],
  ['clickQuoteButton', 'Quote'],
].forEach(([commandName, toolbarButtonName]) => {
  Cypress.Commands.add(commandName, opts => {
    return cy.clickToolbarButton(toolbarButtonName, opts);
  });
});

Cypress.Commands.add('clickModeToggle', () => {
  cy.get('button[role="switch"]')
    .click()
    .focused();
});

[['insertCodeBlock', 'Code Block']].forEach(([commandName, componentTitle]) => {
  Cypress.Commands.add(commandName, () => {
    return cy.insertEditorComponent(componentTitle);
  });
});

Cypress.Commands.add('getMarkdownEditor', () => {
  return cy.get('[data-slate-editor]');
});

Cypress.Commands.add('confirmMarkdownEditorContent', expectedDomString => {
  return cy.getMarkdownEditor().should(([element]) => {
    // Slate makes the following representations:
    // - blank line: 2 BOM's + <br>
    // - blank element (placed inside empty elements): 1 BOM + <br>
    // - inline element (e.g. link tag <a>) are wrapped with BOM characters (https://github.com/ianstormtaylor/slate/issues/2722)
    // We replace to represent a blank line as a single <br>, remove the
    // contents of elements that are actually empty, and remove BOM characters wrapping <a> tags
    const actualDomString = toPlainTree(element.innerHTML)
      .replace(/\uFEFF\uFEFF<br>/g, '<br>')
      .replace(/\uFEFF<br>/g, '')
      .replace(/\uFEFF<a>/g, '<a>')
      .replace(/<\/a>\uFEFF/g, '</a>');
    expect(actualDomString).toEqual(oneLineTrim(expectedDomString));
  });
});

Cypress.Commands.add('clearMarkdownEditorContent', () => {
  return cy
    .getMarkdownEditor()
    .selectAll()
    .backspace({ times: 2 });
});

function toPlainTree(domString) {
  return rehype()
    .use(removeSlateArtifacts)
    .data('settings', { fragment: true })
    .processSync(domString).contents;
}

function getActualBlockChildren(node) {
  if (node.tagName === 'span') {
    return node.children.flatMap(getActualBlockChildren);
  }
  if (node.children) {
    return { ...node, children: node.children.flatMap(getActualBlockChildren) };
  }
  return node;
}

function removeSlateArtifacts() {
  return function transform(tree) {
    visit(tree, 'element', node => {
      // remove all element attributes
      delete node.properties;

      // remove slate padding spans to simplify test cases
      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'].includes(node.tagName)) {
        node.children = node.children.flatMap(getActualBlockChildren);
      }
    });
  };
}

function getTextNode(el, match) {
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
  if (!match) {
    return walk.nextNode();
  }

  let node;
  while ((node = walk.nextNode())) {
    if (node.wholeText.includes(match)) {
      return node;
    }
  }
}

function setBaseAndExtent(...args) {
  const document = args[0].ownerDocument;
  document.getSelection().removeAllRanges();
  document.getSelection().setBaseAndExtent(...args);
}
