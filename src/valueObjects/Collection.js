import { FOLDER, FILES } from '../constants/collectionTypes';

function formatToExtension(format) {
  return {
    markdown: 'md',
    yaml: 'yml',
    json: 'json',
    html: 'html',
  }[format];
}

class FolderCollection {
  constructor(collection) {
    this.collection = collection;
  }

  entryFields() {
    return this.collection.get('fields');
  }

  entryPath(slug) {
    return `${ this.collection.get('folder') }/${ slug }.${ this.entryExtension() }`;
  }

  entrySlug(path) {
    return path.split('/').pop().replace(/\.[^\.]+$/, '');
  }

  listMethod() {
    return 'entriesByFolder';
  }

  entryExtension() {
    return this.collection.get('extension') || formatToExtension(this.collection.get('format') || 'markdown');
  }

  allowNewEntries() {
    return this.collection.get('create');
  }

  templateName() {
    return this.collection.get('name');
  }
}

class FilesCollection {
  constructor(collection) {
    this.collection = collection;
  }

  entryFields(slug) {
    const file = this.fileForEntry(slug);
    return file && file.get('fields');
  }

  entryPath(slug) {
    const file = this.fileForEntry(slug);
    return file && file.get('file');
  }

  entrySlug(path) {
    const file = this.collection.get('files').filter(f => f.get('file') === path).get(0);
    return file && file.get('name');
  }

  fileForEntry(slug) {
    const files = this.collection.get('files');
    return files.filter(f => f.get('name') === slug).get(0);
  }

  listMethod() {
    return 'entriesByFiles';
  }

  allowNewEntries() {
    return false;
  }

  templateName(slug) {
    return slug;
  }
}

export default class Collection {
  constructor(collection) {
    switch (collection.get('type')) {
      case FOLDER:
        this.collection = new FolderCollection(collection);
        break;
      case FILES:
        this.collection = new FilesCollection(collection);
        break;
      default:
        throw ('Unknown collection type: %o', collection.get('type'));
    }
  }

  entryFields(slug) {
    return this.collection.entryFields(slug);
  }

  entryPath(slug) {
    return this.collection.entryPath(slug);
  }

  entrySlug(path) {
    return this.collection.entrySlug(path);
  }

  listMethod() {
    return this.collection.listMethod();
  }

  allowNewEntries() {
    return this.collection.allowNewEntries();
  }

  templateName(slug) {
    return this.collection.templateName(slug);
  }
}
