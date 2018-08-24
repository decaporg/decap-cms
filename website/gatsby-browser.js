// Make scroll behavior of internal links smooth
exports.onClientEntry = () => {
  const SmoothScroll = require('smooth-scroll');
  new SmoothScroll('a[href*="#"]', {
    offset() {
      return document.querySelector('#header').offsetHeight;
    },
  });
};
