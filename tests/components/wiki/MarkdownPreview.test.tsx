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

  it('applies styling classes to headings', () => {
    render(<MarkdownPreview content="## Section" />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading.className).toContain('text-xl');
  });

  it('renders lists with bullet styling', () => {
    const { container } = render(<MarkdownPreview content="- item one\n- item two" />);
    const ul = container.querySelector('ul');
    expect(ul).toBeInTheDocument();
    expect(ul?.className).toContain('list-disc');
  });

  it('renders rich markdown elements with expected styles', () => {
    const { container } = render(
      <MarkdownPreview
        content={[
          '### Heading 3',
          'Inline `code` and **strong text**.',
          '',
          '1. One',
          '2. Two',
          '',
          '> Quoted text',
          '',
          '---',
          '',
          '```ts',
          'const x = 1;',
          '```',
          '',
          '| Col A | Col B |',
          '| --- | --- |',
          '| A1 | B1 |',
          '',
          '![Diagram](https://example.com/diagram.png)',
        ].join('\n')}
      />,
    );

    expect(screen.getByRole('heading', { level: 3 })).toHaveClass('text-lg');
    expect(container.querySelector('ol')?.className).toContain('list-decimal');
    expect(container.querySelector('blockquote')?.className).toContain('border-l-4');
    expect(container.querySelector('hr')?.className).toContain('border-outline-variant');
    expect(container.querySelector('pre')?.className).toContain('bg-pav-blue');
    expect(container.querySelector('code.language-ts')).toBeInTheDocument();
    expect(container.querySelector('code:not(.language-ts)')?.className).toContain('rounded');
    expect(container.querySelector('table')).toBeInTheDocument();
    expect(container.querySelector('th')?.className).toContain('font-semibold');
    expect(container.querySelector('td')?.className).toContain('text-on-surface');
    expect(container.querySelector('strong')?.className).toContain('font-semibold');
    expect(container.querySelector('img')?.className).toContain('max-w-full');
  });
});
