import fs from "fs";
import path from "path";
import process from "process";
import yaml from 'js-yaml';
import deepEqual from 'deep-equal';
import { formatByExtension } from "../src/formats/formats";

const looksLikeMarkdown = /(\[.+\]\(.+\)|\n?[#]+ [a-z0-9])/; // eslint-disable-line
const looksLikeAnImage = /^[^ ]+\.(png|jpg|svg|gif|jpeg)/;

function capitalize(name) {
  return name.substr(0, 1).toUpperCase() + name.substr(1);
}

function inferWidget(name, value) {
  if (value == null) {
    return { widget: 'string' };
  }
  if (value instanceof Date) {
    return { widget: value.toJSON().match(/T00:00:00\.000Z$/) ? 'date' : 'datetime' };
  }
  if (value instanceof Array) {
    if (typeof value[0] === 'string') {
      return { widget: 'list' };
    }
    return { widget: 'list', fields: inferFields(value) };
  }
  if (typeof value === 'object') {
    return { widget: 'object', fields: inferFields([value]) };
  }
  if (value === false || value === true) {
    return { widget: 'checkbox' };
  }
  if (typeof value === 'number') {
    return { widget: 'number' };
  }
  if (name === 'body' || value.match(looksLikeMarkdown)) {
    return { widget: 'markdown' };
  }
  if (value.match(/\n/)) {
    return { widget: 'text' };
  }
  if (value.match(looksLikeAnImage)) {
    return { widget: 'image' };
  }
  return { widget: 'string' };
}

function inferField(name, value) {
  return Object.assign({
    label: capitalize(name.replace(/_-/g, ' ')),
    name,
  }, inferWidget(name, value));
}

function inferFields(entries) {
  const fields = {};
  entries.forEach((entry) => {
    if (entry == null) { return; }
    Object.keys(entry).forEach((fieldName) => {
      const field = inferField(fieldName, entry[fieldName]);
      if (fields[fieldName]) {
        fields[fieldName] = combineFields(fields[fieldName], field);
      } else {
        fields[fieldName] = field;
      }
    });
  });
  return Object.keys(fields).map(key => fields[key]);
}

const widgetRank = {
  markdown: 1,
  text: 2,
  string: 3,
  image: 4,
  datetime: 4,
  date: 5,
  number: 5,
  object: 7,
  list: 7,
};

function compareWidget(a, b) {
  return widgetRank[a] - widgetRank[b];
}

function combineFields(a, b) {
  if (b == null && a) {
    return a;
  }
  if (a == null && b) {
    return b;
  }
  if (deepEqual(a, b)) {
    return a;
  }
  if (a.widget === b.widget) {
    if (a.fields && b.fields) {
      const newFields = {};
      a.fields.forEach((field) => {
        newFields[field.name] = combineFields(field, b.fields.find(f => f.name === field.name));
      });
      b.fields.forEach((field) => {
        if (!newFields[field.name]) {
          newFields[field.name] = field;
        }
      });
      return Object.assign({}, a, { fields: Object.keys(newFields).map(k => newFields[k]) });
    }
    return a;
  }
  return [a, b].sort((fieldA, fieldB) => compareWidget(fieldB.widget, fieldA.widget))[0];
}

if (process.argv.length !== 3) {
  console.log("Usage: autoconfigure.collections.js <path-to-my-folder>");
  process.exit(1);
}

const folder = process.argv[2].replace(/\/$/, '');
const files = fs.readdirSync(folder);
const extensions = {};

files.forEach((file) => {
  const ext = file.split(".").pop();
  if (ext) {
    extensions[ext] = extensions[ext] || 0;
    extensions[ext] += 1;
  }
});

const name = folder.split('/').filter(s => s).pop();
const extension = Object.keys(extensions).sort((a, b) => extensions[b] - extensions[a])[0];
const format = formatByExtension(extension);
const entries = files.filter(name => name.split(".").pop() === extension).slice(0, 100).map(file => (
  format.fromFile(fs.readFileSync(path.join(folder, file), { encoding: 'utf8' }))
));
const fields = inferFields(entries);


const collection = {
  label: capitalize(name),
  name,
  folder,
  extension,
  fields,
};

console.log(yaml.safeDump([collection], { flowLevel: 3 }));
