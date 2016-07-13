import UnknownControl from './Widgets/UnknownControl';
import UnknownPreview from './Widgets/UnknownPreview';
import StringControl from './Widgets/StringControl';
import StringPreview from './Widgets/StringPreview';
import MarkdownControl from './Widgets/MarkdownControl';
import MarkdownPreview from './Widgets/MarkdownPreview';
import ImageControl from './Widgets/ImageControl';
import ImagePreview from './Widgets/ImagePreview';


const Widgets = {
  _unknown: {
    Control: UnknownControl,
    Preview: UnknownPreview
  },
  string: {
    Control: StringControl,
    Preview: StringPreview
  },
  markdown: {
    Control: MarkdownControl,
    Preview: MarkdownPreview
  },
  image: {
    Control: ImageControl,
    Preview: ImagePreview
  }
};

export default Widgets;
