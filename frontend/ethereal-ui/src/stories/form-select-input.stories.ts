import type { Meta, StoryObj } from '@storybook/angular';

import { SelectInputComponent } from '../public-api';

const meta: Meta<SelectInputComponent> = {
  title: 'Ethereal UI/Form',
  component: SelectInputComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Native select/dropdown styled for the design system. Supports Angular reactive forms through ControlValueAccessor.',
      },
    },
  },
  argTypes: {
    disabled: { control: 'boolean' },
    options: { control: 'object' },
    valueChanged: { action: 'valueChanged' },
  },
};

export default meta;

export const SelectInput: StoryObj<SelectInputComponent> = {
  args: {
    label: 'Profession',
    placeholder: 'Choose profession',
    hint: 'Backend-backed option lists can be passed in directly.',
    value: 'alchemy',
    disabled: false,
    options: [
      { id: 'alchemy', label: 'Alchemy' },
      { id: 'blacksmithing', label: 'Blacksmithing' },
      { id: 'enchanting', label: 'Enchanting' },
      { id: 'jewelcrafting', label: 'Jewelcrafting' },
    ],
  },
};
