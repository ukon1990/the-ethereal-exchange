import type { StorybookConfig } from '@analogjs/storybook-angular';
import { mergeConfig, type UserConfig } from 'vite';

const config: StorybookConfig = {
  stories: ['../ethereal-ui/src/**/*.stories.ts'],
  addons: ['@storybook/addon-docs'],
  previewHead: (head) => `${head}
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
<style>
  /* Primary aside and top nav links use hidden md:flex; force visible in the workshop iframe */
  ee-side-nav aside,
  ee-top-nav nav { display: flex !important; }
</style>`,
  framework: {
    name: '@analogjs/storybook-angular',
    options: {},
  },
  staticDirs: ['../public'],
  async viteFinal(userConfig: UserConfig) {
    return mergeConfig(userConfig, {
      resolve: {
        tsconfigPaths: true,
      },
    });
  },
};

export default config;
