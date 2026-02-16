import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarkdownPreview } from '../../../src/components/wiki/MarkdownPreview.tsx';

describe('MarkdownPreview', () => {
  it('renders markdown content', () => {
    render(<MarkdownPreview content="**bold text**" />);
    expect(screen.getByText('bold text')).toBeInTheDocument();
  });

  it('renders headings', () => {
    render(<MarkdownPreview content="# Heading 1" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Heading 1');
  });

  it('renders links in markdown', () => {
    render(<MarkdownPreview content="[Click](https://example.com)" />);
    const link = screen.getByRole('link', { name: 'Click' });
    expect(link).toHaveAttribute('href', 'https://example.com');
  });

  it('wraps in prose div', () => {
    const { container } = render(<MarkdownPreview content="test" />);
    expect(container.querySelector('.prose')).toBeInTheDocument();
  });
});
