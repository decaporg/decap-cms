import React from 'react';

/* eslint-disable */
export const INFERABLE_FIELDS = {
  title: {
    type: 'string',
    secondaryTypes: [],
    synonyms: ['title', 'name', 'label', 'headline', 'header'],
    defaultPreview: value => <h1>{ value }</h1>,
    fallbackToFirstField: true,
    showError: true,
  },
  shortTitle: {
    type: 'string',
    secondaryTypes: [],
    synonyms: ['short_title', 'shortTitle', 'short'],
    defaultPreview: value => <h2>{ value }</h2>,
    fallbackToFirstField: false,
    showError: false,
  },
  author: {
    type: 'string',
    secondaryTypes: [],
    synonyms: ['author', 'name', 'by', 'byline', 'owner'],
    defaultPreview: value => <strong>{ value }</strong>,
    fallbackToFirstField: false,
    showError: false,
  },
  description: {
    type: 'string',
    secondaryTypes: ['text', 'markdown'],
    synonyms: ['shortDescription', 'short_description', 'shortdescription', 'description', 'intro', 'introduction', 'brief', 'content', 'biography', 'bio', 'summary'],
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
