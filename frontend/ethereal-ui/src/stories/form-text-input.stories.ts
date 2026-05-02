import type { Meta, StoryObj } from '@storybook/angular';

import { TextInputComponent } from '../public-api';

const meta: Meta<TextInputComponent> = {
  title: 'Ethereal UI/Form',
  component: TextInputComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Single-line text input. Supports standard input/output binding and Angular reactive forms through ControlValueAccessor.',
      },
    },
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'search', 'url'],
    },
    disabled: { control: 'boolean' },
    valueChanged: { action: 'valueChanged' },
  },
};

export default meta;

export const TextInput: StoryObj<TextInputComponent> = {
  args: {
    label: 'Item name',
    placeholder: 'Dracothyst',
    hint: 'Used for generic form text fields.',
    type: 'text',
    value: 'Awakened Order',
    disabled: false,
  },
};
