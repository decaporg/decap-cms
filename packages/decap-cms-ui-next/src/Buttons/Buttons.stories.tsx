import React from 'react';
import { userEvent, waitFor, within, expect, fn } from '@storybook/test';

import { Button, ButtonGroup, IconButton, AvatarButton, FileUploadButton } from '.';
import { iconComponents } from '../Icon';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  args: {
    children: 'Button',
    onClick: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

// export const Default: Story = {
//   play: async ({ args, canvasElement, step }) => {
//     const canvas = within(canvasElement);

//     await step('Click button', async () => {
//       const button = canvas.getByRole('button');
//       await userEvent.click(button);
//     });

//     // assert
//     expect(args.children).toBe('Button');
//     await waitFor(() => expect(args.onClick).toHaveBeenCalled());
//   },
// };

export const Default: Story = {};

export const Neutral: Story = {
  args: {
    type: 'neutral',
  },
};

export const Success: Story = {
  args: {
    type: 'success',
  },
};

export const Danger: Story = {
  args: {
    type: 'danger',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Click button', async () => {
      const button = canvas.getByRole('button');
      await userEvent.click(button);

      expect(args.onClick).not.toHaveBeenCalled();
    });
  },
};

export const WithIcon: Story = {
  args: {
    icon: 'plus',
  },
};

export const WithMenu: Story = {
  args: {
    hasMenu: true,
  },
};

export const Transparent: Story = {
  args: {
    transparent: true,
  },
};

export const Solid: Story = {
  args: {
    variant: 'solid',
  },
};

export const Soft: Story = {
  args: {
    variant: 'soft',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
  },
};

export const ClickInteraction: Story = {
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Click button', async () => {
      const button = canvas.getByRole('button');
      await userEvent.click(button);

      expect(args.onClick).toHaveBeenCalled();
    });
  },
};

// Render all variants of the button in a single story to take only one Image snapshot
export const ImageSnapshot: Story = {
  render: ({ args }) => (
    <ButtonGroup>
      <Button {...args}>Primary Button</Button>
      <Button {...args} type="success">
        Success Button
      </Button>
      <Button {...args} type="danger">
        Danger Button
      </Button>
      <Button {...args} type="neutral">
        Neutral Button
      </Button>
    </ButtonGroup>
  ),
};

// export function _Button(args) {
//   return <Button {...args}>Button</Button>;
// }

// _Button.argTypes = {
//   size: {
//     control: 'select',
//     options: ['sm', 'md', 'lg'],
//     mapping: {
//       md: null,
//     },
//     table: {
//       defaultValue: { summary: 'md' },
//     },
//   },
//   type: {
//     control: 'select',
//     options: ['primary', 'success', 'danger', 'neutral'],

//     table: {
//       defaultValue: { summary: 'primary' },
//     },
//   },
//   variant: {
//     control: 'select',
//     options: ['solid', 'soft'],
//     table: {
//       defaultValue: { summary: 'solid' },
//     },
//   },
//   disabled: {
//     control: 'boolean',
//     table: {
//       defaultValue: { summary: 'false' },
//     },
//   },
//   transparent: {
//     control: 'boolean',
//     table: {
//       defaultValue: { summary: 'false' },
//     },
//   },
//   icon: {
//     control: 'select',
//     options: {
//       default: null,
//       ...Object.keys(iconComponents).reduce((acc, key) => ({ ...acc, [key]: key }), {}),
//     },
//     table: {
//       defaultValue: { summary: 'null' },
//     },
//   },
// };

// _Button.args = {
//   type: 'primary',
//   size: 'md',
//   variant: 'solid',
//   disabled: false,
//   transparent: false,
//   icon: null,
//   onClick: fn(),
// };

// export function _ButtonGroup(args) {
//   return (
//     <ButtonGroup {...args}>
//       <Button>Button 1</Button>
//       <Button>Button 2</Button>
//       <Button primary type="success">
//         Primary Success Button
//       </Button>
//     </ButtonGroup>
//   );
// }

// _ButtonGroup.argTypes = {
//   direction: {
//     control: 'select',
//     options: ['horizontal', 'vertical'],
//     mapping: {
//       horizontal: null,
//     },
//   },
// };

// _ButtonGroup.args = {
//   direction: 'horizontal',
// };

// export function _IconButton(args) {
//   return <IconButton {...args} />;
// }

// _IconButton.argTypes = {
//   icon: {
//     control: 'select',
//     options: {
//       default: null,
//       ...Object.keys(iconComponents).reduce((acc, key) => ({ ...acc, [key]: key }), {}),
//     },
//   },
//   size: {
//     control: 'select',
//     options: ['sm', 'md', 'lg'],
//     mapping: {
//       md: null,
//     },
//   },
//   active: {
//     control: 'boolean',
//   },
// };

// _IconButton.args = {
//   icon: null,
//   size: 'md',
//   active: false,
//   onClick: fn(),
// };

// export function _AvatarButton(args) {
//   return <AvatarButton {...args} />;
// }

// _AvatarButton.argTypes = {
//   src: {
//     control: 'text',
//   },
//   size: {
//     control: 'select',
//     options: ['sm', 'md', 'lg'],
//     mapping: {
//       md: null,
//     },
//   },
//   active: {
//     control: 'boolean',
//   },
// };

// _AvatarButton.args = {
//   src: 'https://randomuser.me/api/portraits/men/94.jpg',
//   size: 'md',
//   active: false,
//   onClick: fn(),
// };

// export function _FileUploadButton(args) {
//   return <FileUploadButton {...args} />;
// }

// _FileUploadButton.argTypes = {
//   label: {
//     control: 'text',
//   },
//   accept: {
//     control: 'select',
//     options: ['audio/*', 'image/*', 'video/*', '*/*'],
//   },
//   size: {
//     control: 'select',
//     options: ['sm', 'md', 'lg'],
//     mapping: {
//       md: null,
//     },
//   },
//   disabled: {
//     control: 'boolean',
//     table: {
//       defaultValue: { summary: 'false' },
//     },
//   },
// };

// _FileUploadButton.args = {
//   label: 'Upload File',
//   accept: 'image/*',
//   size: 'md',
//   disabled: false,
//   onChange: fn(),
// };
