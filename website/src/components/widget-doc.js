import React from 'react';
import classnames from 'classnames';
import Markdown from 'react-markdown';

const WidgetDocItem = ({ label, children }) => (
  <li>
    <div className="widget-doc-item-label">{label}:</div>
    <div>{children}</div>
  </li>
);

const WidgetDocOption = ({ name, description }) => (
  <li>
    <code>{name}</code>:<Markdown source={description} />
  </li>
);

const WidgetDocExample = ({ heading, content }) => (
  <div>
    {heading && (
      <h4>
        <Markdown source={heading} />
      </h4>
    )}
    <Markdown source={content} />
  </div>
);

const WidgetDoc = ({ visible, label, description, ui, dataType, options = [], examples = [] }) => (
  <div className={classnames('widget', { widget_open: visible })}>
    <h3>{label}</h3>
    <p>{description}</p>
    <ul>
      <WidgetDocItem label="UI">{ui}</WidgetDocItem>
      <WidgetDocItem label="Data Type">{dataType}</WidgetDocItem>
      <WidgetDocItem label="Options">
        {options && (
          <ul>
            {options.map(({ name, description }) => (
              <WidgetDocOption key={name} name={name} description={description} />
            ))}
          </ul>
        )}
      </WidgetDocItem>
    </ul>
    <h3>Examples</h3>
    {examples &&
      examples.map(({ heading, content }, idx) => (
        <WidgetDocExample key={idx} heading={heading} content={content} />
      ))}
  </div>
);

export default WidgetDoc;
