import { createElement, type ComponentType, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import './pagination.js';
import type { UiPagination, PaginationChangeDetail } from './pagination.js';

const meta: Meta = {
  title: 'Web Components/Pagination',
  // Tag-name string routes autodocs to the CEM extractor (see .storybook/preview.ts).
  component: 'ui-pagination' as unknown as ComponentType,
  argTypes: {
    currentPage: { control: { type: 'number', min: 1 } },
    totalPages: { control: { type: 'number', min: 1 } },
    siblingCount: { control: { type: 'number', min: 0 } },
    hideJumpToPage: { control: 'boolean' },
    jumpLabel: { control: 'text' },
    pageLabel: { control: 'text' },
  },
  args: {
    currentPage: 5,
    totalPages: 10,
    siblingCount: 1,
    hideJumpToPage: false,
    jumpLabel: 'Go to page',
    pageLabel: 'Page 5 of 10',
  },
};

export default meta;
type Story = StoryObj;

type PaginationArgs = {
  currentPage?: number;
  totalPages?: number;
  siblingCount?: number;
  hideJumpToPage?: boolean;
  jumpLabel?: string;
  pageLabel?: string;
};

/** The component is controlled-only — the story wires ui-change back into current-page. */
const wire = (el: (UiPagination & { __storyWired?: boolean }) | null) => {
  if (!el || el.__storyWired) return;
  el.__storyWired = true;
  el.addEventListener('ui-change', (event) => {
    const { page } = (event as CustomEvent<PaginationChangeDetail>).detail;
    el.currentPage = page;
    const label = el.querySelector('[slot="page-label"]');
    if (label) label.textContent = `Page ${page} of ${el.totalPages}`;
  });
};

const renderPagination = (args: PaginationArgs): ReactNode =>
  createElement(
    'ui-pagination',
    {
      'current-page': args.currentPage,
      'total-pages': args.totalPages,
      'sibling-count': args.siblingCount,
      'hide-jump-to-page': args.hideJumpToPage || undefined,
      'jump-label': args.jumpLabel,
      ref: wire,
    },
    args.pageLabel ? createElement('span', { slot: 'page-label' }, args.pageLabel) : null,
  );

export const Default: Story = {
  render: (args) => renderPagination(args as PaginationArgs),
};

export const WithoutPageLabel: Story = {
  args: { pageLabel: '' },
  render: (args) => renderPagination(args as PaginationArgs),
};

export const HiddenJump: Story = {
  args: { hideJumpToPage: true },
  render: (args) => renderPagination(args as PaginationArgs),
};

export const Boundaries: Story = {
  render: (args) =>
    createElement(
      'div',
      { style: { display: 'grid', gap: 24 } },
      renderPagination({ ...(args as PaginationArgs), currentPage: 1, pageLabel: 'Page 1 of 10' }),
      renderPagination({
        ...(args as PaginationArgs),
        currentPage: 10,
        pageLabel: 'Page 10 of 10',
      }),
    ),
};

export const MobileViewport: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: (args) => renderPagination(args as PaginationArgs),
};

export const OnSurfaces: Story = {
  render: (args) =>
    createElement(
      'div',
      { style: { display: 'grid', gap: 16 } },
      ...[undefined, 'subtle', 'inverse', 'primary'].map((surface) =>
        createElement(
          'div',
          {
            key: surface ?? 'default',
            'data-surface': surface,
            style: { padding: 16, backgroundColor: 'var(--color-background-default)' },
          },
          renderPagination(args as PaginationArgs),
        ),
      ),
    ),
};
