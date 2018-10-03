window.UPLOADCARE_LOCALE_TRANSLATIONS = {
  dialog: {
    tabs: {
      names: {
        library: 'Library',
      },
    },
  },
};

export function makeLibraryTab(getIndex, applyIndex) {
  return function libraryTab(container, button, dialogApi, settings, name) {
    const uploadcare = window.uploadcare;
    const $ = uploadcare.jQuery;

    async function loadItems() {
      var items = (await getIndex()).toArray();

      return items;
    }
    function saveItems(items) {
      applyIndex(items);
    }
    async function addItem(fileInfo) {
      var items = await loadItems();
      items = $.grep(items, function(item) {
        return item.uuid !== fileInfo.uuid;
      });
      var item = [fileInfo.uuid, fileInfo.isImage, fileInfo.size, fileInfo.name];
      items.unshift(item);
      saveItems(items);
    }
    async function removeItem(item) {
      var items = await loadItems();
      items = $.grep(items, function(v) {
        return v[0] !== item[0];
      });
      saveItems(items);
    }
    function makeItem(fileInfo) {
      var html = $('<div class="uploadcare--file uploadcare--files__item"></div>').append([
        $('<div class="uploadcare--file__description"></div>')
          .append([
            $('<div class="uploadcare--file__preview"></div>').append(
              fileInfo.isImage
                ? $('<img/>', {
                    src: settings.cdnBase + '/' + fileInfo.uuid + '/-/quality/lightest/-/preview/54x54/',
                  })
                : $(
                    '<svg width="32" height="32" role="presentation" class="uploadcare--icon uploadcare--file__icon"><use xlink:href="#uploadcare--icon-file"/></svg>',
                  ),
            ),
            $('<div class="uploadcare--file__name"></div>').text(fileInfo.name),
            $('<div class="uploadcare--file__size"></div>').text(
              fileInfo.size
            ),
          ])
          .on('click', function(e) {
            dialogApi.addFiles('uploaded', [fileInfo.uuid]);
            e.preventDefault();
          }),
        $(
          '<button type="button" class="uploadcare--button uploadcare--button_icon uploadcare--button_muted uploadcare--file__remove">\
           <svg role="presentation" width="32" height="32" class="uploadcare--icon">\
             <use xlink:href="#uploadcare--icon-remove"></use>\
           </svg>\
         </button>',
        )
      ]);
      return html;
    }
    async function populate(container) {
      var items = await loadItems();

      items.forEach(item => {
        container.prepend(makeItem(item));
      });
    }

    $(
      '<div class="uploadcare--tab__header">\
      <div class="uploadcare--text uploadcare--text_size_large uploadcare--tab__title">Previous uploaded files</div>\
    </div>',
    ).appendTo(container);

    populate(
      $('<div class="uploadcare--files"></div>')
        .toggleClass('uploadcare--files_type_table', !settings.imagesOnly)
        .toggleClass('uploadcare--files_type_tiles', settings.imagesOnly)
        .appendTo($('<div class="uploadcare--tab__content"></div>').appendTo(container)),
    );
  };
}
