import React from 'react';

export const IDENTIFIER_FIELDS = ['title', 'path'];

export const INFERABLE_FIELDS = {
  title: {
    type: 'string',
    secondaryTypes: [],
    synonyms: ['title', 'name', 'label', 'headline', 'header'],
    defaultPreview: value => <h1>{value}</h1>, // eslint-disable-line react/display-name
    fallbackToFirstField: true,
    showError: true,
  },
  shortTitle: {
    type: 'string',
    secondaryTypes: [],
    synonyms: ['short_title', 'shortTitle', 'short'],
    defaultPreview: value => <h2>{value}</h2>, // eslint-disable-line react/display-name
    fallbackToFirstField: false,
    showError: false,
  },
  author: {
    type: 'string',
    secondaryTypes: [],
    synonyms: ['author', 'name', 'by', 'byline', 'owner'],
    defaultPreview: value => <strong>{value}</strong>, // eslint-disable-line react/display-name
    fallbackToFirstField: false,
    showError: false,
  },
  date: {
    type: 'datetime',
    secondaryTypes: ['date'],
    synonyms: ['date', 'publishDate', 'publish_date'],
    defaultPreview: value => value,
    fallbackToFirstField: false,
    showError: false,
  },
  description: {
    type: 'string',
    secondaryTypes: ['text', 'markdown'],
    synonyms: [
      'shortDescription',
      'short_description',
      'shortdescription',
      'description',
      'intro',
      'introduction',
      'brief',
      'content',
      'biography',
      'bio',
      'summary',
    ],
    defaultPreview: value => value,
    fallbackToFirstField: false,
    showError: false,
  },
  image: {
    type: 'image',
    secondaryTypes: [],
    synonyms: ['image', 'thumbnail', 'thumb', 'picture', 'avatar', 'photo', 'cover'],
    defaultPreview: value => value,
    fallbackToFirstField: false,
    showError: false,
  },
};
