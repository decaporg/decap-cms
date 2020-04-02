import yaml from 'yaml';
import { sortKeys } from './helpers';

const addComments = (items, comments, prefix = '') => {
  items.forEach(item => {
    if (item.key !== undefined) {
      const itemKey = item.key.toString();
      const key = prefix ? `${prefix}.${itemKey}` : itemKey;
      if (comments[key]) {
        item.commentBefore = ` ${comments[key]}`;
      }
      if (Array.isArray(item.value?.items)) {
        addComments(item.value.items, comments, key);
      }
    }
  });
};

export default {
  fromFile(content) {
    if (content && content.trim().endsWith('---')) {
      content = content.trim().slice(0, -3);
    }
    return yaml.parse(content);
  },

  toFile(data, sortedKeys = [], comments = {}) {
    const contents = yaml.createNode(data);

    addComments(contents.items, comments);

    contents.items.sort(sortKeys(sortedKeys, item => item.key.toString()));
    const doc = new yaml.Document();
    doc.contents = contents;

    return doc.toString();
  },
};
