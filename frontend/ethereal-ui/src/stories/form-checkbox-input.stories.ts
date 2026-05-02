import type { Meta, StoryObj } from '@storybook/angular';

import { CheckboxInputComponent } from '../public-api';

const meta: Meta<CheckboxInputComponent> = {
  title: 'Ethereal UI/Form',
  component: CheckboxInputComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Boolean checkbox input for filters and settings. Supports Angular reactive forms through ControlValueAccessor.',
      },
    },
  },
  argTypes: {
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    checkedChanged: { action: 'checkedChanged' },
  },
};

export default meta;

export const CheckboxInput: StoryObj<CheckboxInputComponent> = {
  args: {
    label: 'Only show profitable crafts',
    hint: 'Include items where expected profit is positive.',
    checked: true,
    disabled: false,
  },
};
