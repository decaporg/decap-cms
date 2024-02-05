import React from 'react';
import styled from '@emotion/styled';

import {
  TextInput,
  DateInput,
  ListInput,
  BooleanInput,
  ObjectInput,
  SelectInput,
  MarkdownInput,
} from '../Inputs';

const EditorWrap = styled.div`
  background-color: ${({ theme }) => theme.color.surface};
`;

class Editor extends React.Component {
  state = { entry: {} };
  setValue = valObj =>
    this.setState({
      entry: {
        ...this.state.entry,
        ...valObj,
      },
    });

  render() {
    const { entry } = this.state;
    return (
      <EditorWrap>
        <TextInput
          title
          name="title"
          label="Title"
          value={entry.title}
          onChange={title => this.setValue({ title })}
        />
        <DateInput
          name="datePublished"
          label="Date Published"
          value={entry.datePublished}
          onChange={datePublished => this.setValue({ datePublished })}
        />
        <SelectInput
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
        <TextInput
          name="description"
          label="Description"
          value={entry.description}
          onChange={description => this.setValue({ description })}
        />
        <BooleanInput
          name="featured"
          label="Featured"
          value={entry.featured}
          onChange={featured => this.setValue({ featured })}
        />
        <MarkdownInput name="body" label="Body" onChange={body => this.setValue({ body })} />
        <ListInput
          name="features"
          label="Features"
          labelSingular="Feature"
          onChange={features => this.setValue({ features })}
          fields={(setItemValue, index) => (
            <React.Fragment>
              <TextInput
                name="featureTitle"
                label="Title"
                value={
                  entry.features && entry.features[index] && entry.features[index].featureTitle
                }
                onChange={featureTitle => setItemValue({ featureTitle }, index)}
              />
              <TextInput
                name="featureDescription"
                label="Description"
                value={
                  entry.features &&
                  entry.features[index] &&
                  entry.features[index].featureDescription
                }
                onChange={featureDescription => setItemValue({ featureDescription }, index)}
              />
              <ListInput
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
                    <TextInput
                      name="featureLinkText"
                      label="Text"
                      onChange={featureLinkText => setLinkItemValue({ featureLinkText }, linkIndex)}
                    />
                    <TextInput
                      name="featureLinkPath"
                      label="Path"
                      onChange={featureLinkPath => setLinkItemValue({ featureLinkPath }, linkIndex)}
                    />
                  </React.Fragment>
                )}
              />
              <TextInput
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
        <ObjectInput
          name="link"
          label="Link"
          onChange={link => this.setValue({ link })}
          fields={setValue => (
            <React.Fragment>
              <TextInput
                name="featureLinkText"
                label="Text"
                onChange={featuredImage => setValue({ featuredImage })}
              />
              <TextInput
                name="featureLinkPath"
                label="Path"
                onChange={path => setValue({ path })}
              />
            </React.Fragment>
          )}
        />
      </EditorWrap>
    );
  }
}

export default Editor;
