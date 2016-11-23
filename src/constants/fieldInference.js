import React from 'react';

/* eslint-disable */
export const INFERABLE_FIELDS = {
  title: {
    type: 'string',
    secondaryTypes: [],
    synonyms: ['title', 'name', 'label', 'headline'],
    defaultPreview: value => <h1>{ value }</h1>,
    fallbackToFirstField: true,
    showError: true,
  },
  shortTitle: {
    type: 'string',
    secondaryTypes: [],
    synonyms: ['short_title', 'shortTitle'],
    defaultPreview: value => <h2>{ value }</h2>,
    fallbackToFirstField: false,
    showError: false,
  },
  author: {
    type: 'string',
    secondaryTypes: [],
    synonyms: ['author', 'name', 'by'],
    defaultPreview: value => <strong>{ value }</strong>,
    fallbackToFirstField: false,
    showError: false,
  },
  description: {
    type: 'string',
    secondaryTypes: ['text', 'markdown'],
    synonyms: ['shortDescription', 'short_description', 'shortdescription', 'description', 'intro', 'introduction', 'brief', 'body', 'content', 'biography', 'bio'],
    defaultPreview: value => value,
    fallbackToFirstField: false,
    showError: false,
  },
  image: {
    type: 'image',
    secondaryTypes: [],
    synonyms: ['image', 'thumbnail', 'thumb', 'picture', 'avatar'],
    defaultPreview: value => value,
    fallbackToFirstField: false,
    showError: false,
  },
};
