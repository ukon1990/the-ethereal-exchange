import type { Meta, StoryObj } from '@storybook/angular';

import {
  PageFrameStoryHostComponent,
  SideNavigationStoryHostComponent,
  TopNavigationStoryHostComponent,
} from './story-hosts';

const meta: Meta = {
  title: 'Ethereal UI/Navigation',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

export const TopNavigation: StoryObj<TopNavigationStoryHostComponent> = {
  component: TopNavigationStoryHostComponent,
};

export const SideNavigation: StoryObj<SideNavigationStoryHostComponent> = {
  component: SideNavigationStoryHostComponent,
};

export const PageFrame: StoryObj<PageFrameStoryHostComponent> = {
  component: PageFrameStoryHostComponent,
};
