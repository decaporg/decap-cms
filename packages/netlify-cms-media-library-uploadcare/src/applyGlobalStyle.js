export function applyGlobalStyle() {
  window.addEventListener('load', () => {
    const css = `
        .uploadcare--menu__item_tab_mediaLibrary {

        }
        .uploadcare--menu__item_tab_mediaLibrary.uploadcare--menu__item_current {
          color: #f0cb3c;
        }
        .uploadcare--tab_name_mediaLibrary {
          flex-direction: row;
          flex-wrap: wrap;
          justify-content: flex-start;
          overflow: auto;
        }
        .uploadcare--panel {
          flex-direction: row;
        }
        .mediaLibrary-card {
          width: 140px;
          height: 140px;
          margin: 10px;
          padding: 5px;
          color: rgba(0,0,0,.4);
          box-shadow: 0 6px 20px -3px;
          cursor: pointer;
        }
        .mediaLibrary-card:hover {
          color: rgba(0,100,200,.5);
        }
      `;
    const head = document.head || document.getElementsByTagName('head')[0];
    const style = document.createElement('style');
    style.type = 'text/css';
    style.appendChild(document.createTextNode(css));
    head.appendChild(style);
  });
}
