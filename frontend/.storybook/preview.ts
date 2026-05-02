import type { Preview } from '@storybook/angular';

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'Ethereal Arcana',
      values: [{ name: 'Ethereal Arcana', value: '#17130a' }],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
