import Immutable from 'immutable';
import MarkupIt from 'markup-it';
import markdownSyntax from 'markup-it/syntaxes/markdown';
import reInline from 'markup-it/syntaxes/markdown/re/inline';


/**
 * Test if a link input is an image
 * @param {String} raw
 * @return {Boolean}
 */
function isImage(raw) {
  return raw.charAt(0) === '!';
}

export default function getSyntax(getMedia) {
  const customImageRule = MarkupIt.Rule('mediaproxy')
    .regExp(reInline.link, function(state, match) {
      if (!isImage(match[0])) {
        return;
      }

      var imgData = Immutable.Map({
        alt:   match[1],
        src:   getMedia(match[2]),
        title: match[3]
      }).filter(Boolean);

      return {
        data: imgData
      };
    })
    .regExp(reInline.reflink, function(state, match) {
      if (!isImage(match[0])) {
        return;
      }

      var refId = (match[2] || match[1]);
      return {
        data: { ref: refId }
      };
    })
    .regExp(reInline.nolink, function(state, match) {
      if (!isImage(match[0])) {
        return;
      }

      var refId = (match[2] || match[1]);
      return {
        data: { ref: refId }
      };
    })
    .regExp(reInline.reffn, function(state, match) {
      if (!isImage(match[0])) {
        return;
      }

      var refId = match[1];
      return {
        data: { ref: refId }
      };
    })
    .toText(function(state, token) {
      var data  = token.getData();
      var alt   = data.get('alt', '');
      var src   = getMedia(data.get('src', ''));
      var title = data.get('title', '');

      if (title) {
        return '![' + alt + '](' + src + ' "' + title + '")';
      } else {
        return '![' + alt + '](' + src + ')';
      }
    });

  return markdownSyntax.addInlineRules(customImageRule);
}
