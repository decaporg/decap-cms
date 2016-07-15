const base = document.querySelector('base');

let basePath;
if (base && base.href) {
  basePath = base.attributes.getNamedItem('href').value;
} else {
  basePath = '';
}

export default basePath;
