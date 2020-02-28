import React, { useState } from 'react';
import styled from '@emotion/styled';
import Field from '../Field';
import Tree from '../Tree';

const StyledInput = styled.input`
  background: none;
  border: none;
  outline: none;
  width: calc(100% + 32px);
  font-size: 1rem;
  line-height: 1rem;
  caret-color: ${({ theme }) => theme.color.primary['400']};
  margin: -2rem -1rem -1rem -1rem;
  padding: 2rem 1rem 1rem 1rem;
  ::placeholder {
    color: ${({ theme }) => theme.color.neutral['300']};
  }
`;

const StyledField = styled(Field)`
  padding: 0 0 0 1rem;
`;

const TextWidget = ({ name, label, onChange, placeholder, children, value, fields }) => {
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
