import { Map } from 'immutable';

const commitMessageTemplates = Map({
  create: 'Create {{collection}} “{{slug}}”',
  update: 'Update {{collection}} “{{slug}}”',
  delete: 'Delete {{collection}} “{{slug}}”',
  uploadMedia: 'Upload “{{path}}”',
  deleteMedia: 'Delete “{{path}}”',
  openAuthoring: '{{message}}',
});

const variableRegex = /\{\{([^}]+)\}\}/g;

export const commitMessageFormatter = (
  type,
  config,
  { slug, path, collection, authorLogin, authorName },
  isOpenAuthoring,
) => {
  const templates = commitMessageTemplates.merge(
    config.getIn(['backend', 'commit_messages'], Map()),
  );

  const commitMessage = templates.get(type).replace(variableRegex, (_, variable) => {
    switch (variable) {
      case 'slug':
        return slug;
      case 'path':
        return path;
      case 'collection':
        return collection.get('label_singular') || collection.get('label');
      default:
        console.warn(`Ignoring unknown variable “${variable}” in commit message template.`);
        return '';
    }
  });

  if (!isOpenAuthoring) {
    return commitMessage;
  }

  const message = templates.get('openAuthoring').replace(variableRegex, (_, variable) => {
    switch (variable) {
      case 'message':
        return commitMessage;
      case 'author-login':
        return authorLogin || '';
      case 'author-name':
        return authorName || '';
      default:
        console.warn(`Ignoring unknown variable “${variable}” in open authoring message template.`);
        return '';
    }
  });

  return message;
};
