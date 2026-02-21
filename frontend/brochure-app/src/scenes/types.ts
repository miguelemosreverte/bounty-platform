import type { ComponentType } from 'react';
import type { MockState } from '../mocks/next-navigation';

export type { MockState };

export interface Step {
  label: string;
  durationMs: number;
  component: ComponentType<any>;
  componentProps?: Record<string, any>;
  layout: 'backoffice' | 'public' | 'none';
  mockState: MockState;
  scrollPercent?: number; // 0-100 — after mounting, scroll the viewport to this % of content
}

export interface Story {
  id: string;
  title: string;
  description: string;
  steps: Step[];
}

export interface SectionEditorial {
  intro: string;
  pullquote: string;
  dataCallouts?: { label: string; value: string; detail: string }[];
}

export interface Section {
  id: string;
  numeral: string;
  title: string;
  subtitle: string;
  accent: string;
  icon: string;
  editorial: SectionEditorial;
  stories: Story[];
}
