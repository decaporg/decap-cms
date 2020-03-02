import React, { useState } from 'react';
import styled from '@emotion/styled';
import Field from '../Field';
import Tree from '../Tree';

const StyledField = styled(Field)`
  padding: 0 0 0 1rem;
`;

const TextWidget = ({ label, onChange, fields }) => {
  const [expanded, setExpanded] = useState(true);
  const [data, setData] = useState();
  const [treeType, setTreeType] = useState();

  const handleChange = changes => {
    const newData = { ...data, ...changes };
    setData(newData);
    onChange(newData);
  };

  return (
    <StyledField>
      <Tree
        single
        onExpandToggle={() => (expanded ? setExpanded(false) : setExpanded(true))}
        expanded={expanded}
        label={`${label}`}
        description={data && !!Object.keys(data).length && data[Object.keys(data)[0]]}
        type={treeType}
        onHeaderMouseEnter={() => setTreeType('success')}
        onHeaderMouseLeave={() => setTreeType(null)}
      >
        {fields && fields(handleChange)}
      </Tree>
    </StyledField>
  );
};

export default TextWidget;
