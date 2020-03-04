import React from 'react';
import styled from '@emotion/styled';
import {
  TextWidget,
  DateWidget,
  ListWidget,
  BooleanWidget,
  ObjectWidget,
  SelectWidget,
  MarkdownWidget,
} from '../widgets';

import TestSandbox from '../TestSandbox';

const EditorWrap = styled.div`
  background-color: ${({ theme }) => theme.color.surface};
`;

class Editor extends React.Component {
  state = { entry: {}, debug: true };
  setValue = valObj =>
    this.setState({
      entry: {
        ...this.state.entry,
        ...valObj,
      },
    });

  render() {
    const { entry, debug } = this.state;
    return (
      <EditorWrap>
        <TextWidget
          title
          name="title"
          label="Title"
          value={entry.title}
          onChange={title => this.setValue({ title })}
        />
        <DateWidget
          name="datePublished"
          label="Date Published"
          value={entry.datePublished}
          onChange={datePublished => this.setValue({ datePublished })}
        />
        <SelectWidget
          name="category"
          label="Categories"
          labelSingular="Category"
          value={entry.category}
          onChange={category => this.setValue({ category })}
          options={[
            { name: 'general', label: 'General' },
            { name: 'advice', label: 'Advice' },
            { name: 'opinion', label: 'Opinion' },
            { name: 'technology', label: 'Technology' },
            { name: 'businessFinance', label: 'Business & Finance' },
            { name: 'foodCooking', label: 'Food & Cooking' },
            { name: 'worldPolitics', label: 'World & Politics' },
            { name: 'moviesEntretainment', label: 'Movies & Entertainment' },
            { name: 'lifestyle', label: 'Lifestyle' },
            { name: 'homeGardening', label: 'Home & Gardening' },
          ]}
        />
        <TextWidget
          name="description"
          label="Description"
          value={entry.description}
          onChange={description => this.setValue({ description })}
        />
        <BooleanWidget
          name="featured"
          label="Featured"
          value={entry.featured}
          onChange={featured => this.setValue({ featured })}
        />
        <MarkdownWidget name="body" label="Body" onChange={body => this.setValue({ body })} />
        <ListWidget
          name="features"
          label="Features"
          labelSingular="Feature"
          onChange={features => this.setValue({ features })}
          fields={(setItemValue, index) => (
            <React.Fragment>
              <TextWidget
                name="featureTitle"
                label="Title"
                value={
                  entry.features && entry.features[index] && entry.features[index].featureTitle
                }
                onChange={featureTitle => setItemValue({ featureTitle }, index)}
              />
              <TextWidget
                name="featureDescription"
                label="Description"
                value={
                  entry.features &&
                  entry.features[index] &&
                  entry.features[index].featureDescription
                }
                onChange={featureDescription => setItemValue({ featureDescription }, index)}
              />
              <ListWidget
                name="featureLinks"
                label="Links"
                labelSingular="Link"
                onChange={featureLinks =>
                  this.setValue({
                    features: [
                      ...entry.features.filter((feature, i) => i !== index),
                      {
                        ...entry.features[index],
                        featureLinks,
                      },
                    ],
                  })
                }
                fields={(setLinkItemValue, linkIndex) => (
                  <React.Fragment>
                    <TextWidget
                      name="featureLinkText"
                      label="Text"
                      onChange={featureLinkText => setLinkItemValue({ featureLinkText }, linkIndex)}
                    />
                    <TextWidget
                      name="featureLinkPath"
                      label="Path"
                      onChange={featureLinkPath => setLinkItemValue({ featureLinkPath }, linkIndex)}
                    />
                  </React.Fragment>
                )}
              />
              <TextWidget
                name="featureNotes"
                label="Notes"
                value={
                  entry.features && entry.features[index] && entry.features[index].featureNotes
                }
                onChange={featureNotes => setItemValue({ featureNotes }, index)}
              />
            </React.Fragment>
          )}
        />
        <ObjectWidget
          name="link"
          label="Link"
          onChange={link => this.setValue({ link })}
          fields={setValue => (
            <React.Fragment>
              <TextWidget
                name="featureLinkText"
                label="Text"
                onChange={featuredImage => setValue({ featuredImage })}
              />
              <TextWidget
                name="featureLinkPath"
                label="Path"
                onChange={path => setValue({ path })}
              />
            </React.Fragment>
          )}
        />
        <BooleanWidget
          name="debug"
          label="Debug"
          value={debug}
          onChange={debug => this.setState({ debug })}
        />
        {debug && <TestSandbox data={this.state.entry} />}
      </EditorWrap>
    );
  }
}

export default Editor;
