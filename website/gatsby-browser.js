import SmoothScroll from 'smooth-scroll';

// Make scroll behavior of internal links smooth
exports.onClientEntry = () => {
  new SmoothScroll('a[href*="#"]', {
    offset() {
      return document.querySelector('#header').offsetHeight;
    }
  });
};
