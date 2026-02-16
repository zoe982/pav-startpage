import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DiffView } from '../../../src/components/brandVoice/DiffView.tsx';

describe('DiffView', () => {
  it('renders unchanged text without styling', () => {
    const { container } = render(<DiffView original="Hello world" rewritten="Hello world" />);
    const spans = container.querySelectorAll('span');
    expect(spans).toHaveLength(1);
    expect(spans[0]!.textContent).toBe('Hello world');
    expect(spans[0]!.className).toBe('');
  });

  it('renders added text with green styling', () => {
    const { container } = render(<DiffView original="Hello" rewritten="Hello world" />);
    const greenSpan = container.querySelector('.bg-success-container');
    expect(greenSpan).not.toBeNull();
    expect(greenSpan!.textContent).toContain('world');
  });

  it('renders removed text with red strikethrough', () => {
    const { container } = render(<DiffView original="Hello world" rewritten="Hello" />);
    const redSpan = container.querySelector('.bg-error-container');
    expect(redSpan).not.toBeNull();
    expect(redSpan!.textContent).toContain('world');
    expect(redSpan!.className).toContain('line-through');
  });

  it('renders both additions and removals', () => {
    const { container } = render(<DiffView original="The cat sat" rewritten="The dog sat" />);
    const redSpan = container.querySelector('.bg-error-container');
    const greenSpan = container.querySelector('.bg-success-container');
    expect(redSpan).not.toBeNull();
    expect(greenSpan).not.toBeNull();
    expect(redSpan!.textContent).toContain('cat');
    expect(greenSpan!.textContent).toContain('dog');
  });
});
