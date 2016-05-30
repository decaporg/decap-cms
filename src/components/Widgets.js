import UnknownControl from './widgets/UnknownControl';
import UnknownPreview from './widgets/UnknownPreview';
import StringControl from './widgets/StringControl';
import StringPreview from './widgets/StringPreview';
import MarkdownControl from './widgets/MarkdownControl';
import MarkdownPreview from './widgets/MarkdownPreview';
import ImageControl from './widgets/ImageControl';
import ImagePreview from './widgets/ImagePreview';


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
