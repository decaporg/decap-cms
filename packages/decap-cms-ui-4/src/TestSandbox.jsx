import React, { useState } from 'react';
import styled from '@emotion/styled';

import Button from './Button';
import ButtonGroup from './ButtonGroup';
import Dialog from './Dialog';
import { toast } from './Toast';

const StyledPre = styled.pre`
  background-color: ${({ theme }) => theme.color.neutral['50']};
  border-radius: 8px;
  max-width: 800px;
  margin: 0 auto;
`;
const CenterWrap = styled.div`
  padding: 1rem;
`;
const CenterInside = styled.div`
  max-width: 800px;
  margin: 12px auto;
`;
const Row = styled.div`
  padding: 12px 0;
`;

const TestSandbox = ({ data }) => {
  const [defaultDialogOpen, setDefaultDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [dangerDialogOpen, setDangerDialogOpen] = useState(false);
  const [defaultSmallDialogOpen, setDefaultSmallDialogOpen] = useState(false);
  const [successSmallDialogOpen, setSuccessSmallDialogOpen] = useState(false);
  const [dangerSmallDialogOpen, setDangerSmallDialogOpen] = useState(false);

  return (
    <CenterWrap>
      <CenterInside>
        <div>Click these buttons to see toast.</div>
        <Row>
          <ButtonGroup>
            <Button
              onClick={() =>
                toast({
                  title: 'Default toast',
                  content: 'This is an example of a default toast.',
                  // autoClose: 10000
                })
              }
            >
              Default Button
            </Button>
            <Button
              type="success"
              onClick={() =>
                toast({
                  title: 'Success toast',
                  content: 'This is an example of a success toast.',
                  type: 'success',
                  // autoClose: false
                })
              }
            >
              Success Button
            </Button>
            <Button
              type="danger"
              onClick={() =>
                toast({
                  title: 'Danger toast',
                  content: 'This is an example of a danger toast.',
                  type: 'error',
                })
              }
            >
              Danger Button
            </Button>
          </ButtonGroup>
        </Row>
        <div>Click these buttons to see small toast.</div>
        <Row>
          <ButtonGroup>
            <Button
              size="sm"
              onClick={() =>
                toast({
                  content: 'This is an example of a default toast.',
                })
              }
            >
              Small Default Button
            </Button>
            <Button
              size="sm"
              type="success"
              onClick={() =>
                toast({
                  content: 'This is an example of a success toast.',
                  type: 'success',
                })
              }
            >
              Small Success Button
            </Button>
            <Button
              size="sm"
              type="danger"
              onClick={() =>
                toast({
                  content: 'This is an example of a danger toast.',
                  type: 'error',
                })
              }
            >
              Small Danger Button
            </Button>
          </ButtonGroup>
        </Row>
        <div>Click these buttons to see dialogs.</div>
        <Row>
          <ButtonGroup>
            <Button primary onClick={() => setDefaultDialogOpen(true)}>
              Primary Default Button
            </Button>
            <Button primary type="success" onClick={() => setSuccessDialogOpen(true)}>
              Primary Success Button
            </Button>
            <Button primary type="danger" onClick={() => setDangerDialogOpen(true)}>
              Primary Danger Button
            </Button>
          </ButtonGroup>
          <Dialog
            title="Default dialog"
            open={defaultDialogOpen}
            onClose={() => setDefaultDialogOpen(false)}
            actions={
              <ButtonGroup>
                <Button onClick={() => setDefaultDialogOpen(false)}>Cancel</Button>
                <Button primary type="default" onClick={() => setDefaultDialogOpen(false)}>
                  Okie day
                </Button>
              </ButtonGroup>
            }
          >
            Help me, Obi-Wan Kenobi. You’re my only hope.
          </Dialog>
          <Dialog
            title="Success dialog"
            open={successDialogOpen}
            onClose={() => setSuccessDialogOpen(false)}
            actions={
              <ButtonGroup>
                <Button onClick={() => setSuccessDialogOpen(false)}>Cancel</Button>
                <Button primary type="success" onClick={() => setSuccessDialogOpen(false)}>
                  Become a Jedi
                </Button>
              </ButtonGroup>
            }
          >
            The Force will be with you. Always.
          </Dialog>
          <Dialog
            title="Danger dialog"
            open={dangerDialogOpen}
            onClose={() => setDangerDialogOpen(false)}
            actions={
              <ButtonGroup>
                <Button onClick={() => setDangerDialogOpen(false)}>Cancel</Button>
                <Button primary type="danger" onClick={() => setDangerDialogOpen(false)}>
                  How Wude!
                </Button>
              </ButtonGroup>
            }
          >
            Fear is the path to the dark side. Fear leads to anger; anger leads to hate; hate leads
            to suffering. I sense much fear in you.
          </Dialog>
        </Row>
        <div>Click these buttons to see small dialogs.</div>
        <Row>
          <ButtonGroup>
            <Button primary size="sm" onClick={() => setDefaultSmallDialogOpen(true)}>
              Small Primary Default Button
            </Button>
            <Button
              primary
              size="sm"
              type="success"
              onClick={() => setSuccessSmallDialogOpen(true)}
            >
              Small Primary Success Button
            </Button>
            <Button primary size="sm" type="danger" onClick={() => setDangerSmallDialogOpen(true)}>
              Small Primary Danger Button
            </Button>
          </ButtonGroup>
          <Dialog
            title="Default small dialog"
            open={defaultSmallDialogOpen}
            onClose={() => setDefaultSmallDialogOpen(false)}
            actions={
              <ButtonGroup>
                <Button onClick={() => setDefaultSmallDialogOpen(false)}>Cancel</Button>
                <Button primary type="default" onClick={() => setDefaultSmallDialogOpen(false)}>
                  Okie day
                </Button>
              </ButtonGroup>
            }
          />
          <Dialog
            title="Success small dialog"
            open={successSmallDialogOpen}
            onClose={() => setSuccessSmallDialogOpen(false)}
            actions={
              <ButtonGroup>
                <Button onClick={() => setSuccessSmallDialogOpen(false)}>Cancel</Button>
                <Button primary type="success" onClick={() => setSuccessSmallDialogOpen(false)}>
                  Become a Jedi
                </Button>
              </ButtonGroup>
            }
          />
          <Dialog
            title="Danger small dialog"
            open={dangerSmallDialogOpen}
            onClose={() => setDangerSmallDialogOpen(false)}
            actions={
              <ButtonGroup>
                <Button onClick={() => setDangerSmallDialogOpen(false)}>Cancel</Button>
                <Button primary type="danger" onClick={() => setDangerSmallDialogOpen(false)}>
                  How Wude!
                </Button>
              </ButtonGroup>
            }
          />
        </Row>
        <StyledPre>{JSON.stringify(data, null, 2)}</StyledPre>
      </CenterInside>
    </CenterWrap>
  );
};

export default TestSandbox;
