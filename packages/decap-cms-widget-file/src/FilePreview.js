import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { List } from 'immutable';
import { WidgetPreviewContainer } from 'decap-cms-ui-default';

// Media that isn't saved yet is served from a `blob:` URL, which belongs to the
// CMS origin. Opened as a page, an SVG there runs its scripts with access to
// the CMS's storage, including the signed-in user's token, so download it.
function isLocalObjectUrl(href) {
  return /^(blob|data):/i.test(String(href));
}

const FileLink = styled(({ href, path }) => (
  <a
    href={href}
    rel="noopener noreferrer"
    target="_blank"
    download={isLocalObjectUrl(href) ? String(path).split('/').pop() : undefined}
  >
    {path}
  </a>
))`
  display: block;
`;

function FileLinkList({ values, getAsset, field }) {
  return (
    <div>
      {values.map(value => (
        <FileLink key={value} path={value} href={getAsset(value, field)} />
      ))}
    </div>
  );
}

function FileContent(props) {
  const { value, getAsset, field } = props;
  if (Array.isArray(value) || List.isList(value)) {
    return <FileLinkList values={value} getAsset={getAsset} field={field} />;
  }
  return <FileLink key={value} path={value} href={getAsset(value, field)} />;
}

function FilePreview(props) {
  return (
    <WidgetPreviewContainer>
      {props.value ? <FileContent {...props} /> : null}
    </WidgetPreviewContainer>
  );
}

FilePreview.propTypes = {
  getAsset: PropTypes.func.isRequired,
  value: PropTypes.node,
};

export default FilePreview;
