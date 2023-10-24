import React, { useState } from 'react';
import styled from '@emotion/styled';
import Field, { FieldContext } from '../../Field';
import Tree from '../../Tree';

const StyledField = styled(Field)`
  padding: 0 0 0 1rem;
`;

const ObjectInput = ({ label, onChange, fields, inline, className }) => {
  const [expanded, setExpanded] = useState(true);
  const [data, setData] = useState();
  const [treeType, setTreeType] = useState();

  const handleChange = changes => {
    const newData = { ...data, ...changes };
    setData(newData);
    onChange(newData);
  };

  return (
    <StyledField
      className={className}
      inline={inline}
      insideStyle={{ paddingTop: 0, paddingBottom: 0, paddingRight: 0 }}
    >
      <Tree
        single
        onExpandToggle={() => setExpanded(!expanded)}
        expanded={expanded}
        label={`${label}`}
        description={data && !!Object.keys(data).length && data[Object.keys(data)[0]]}
        type={treeType}
        onHeaderMouseEnter={() => setTreeType('success')}
        onHeaderMouseLeave={() => setTreeType(null)}
      >
        <FieldContext.Provider value={{ inline: true }}>
          {fields && fields(handleChange)}
        </FieldContext.Provider>
      </Tree>
    </StyledField>
  );
};

export default ObjectInput;
