import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MarkdownEditor } from '../../../src/components/wiki/MarkdownEditor.tsx';

// Track the onChange prop passed to MDEditor
let capturedOnChange: ((val: string | undefined) => void) | null = null;

vi.mock('@uiw/react-md-editor', () => ({
  default: ({ value, onChange }: { value: string; onChange: (val: string | undefined) => void }) => {
    capturedOnChange = onChange;
    return (
      <textarea
        data-testid="md-editor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  },
}));

describe('MarkdownEditor', () => {
  it('renders suspense fallback then loaded editor', async () => {
    render(<MarkdownEditor value="# Hello" onChange={vi.fn()} />);

    const editor = await screen.findByTestId('md-editor');
    expect(editor).toHaveValue('# Hello');
  });

  it('calls onChange with value when MDEditor passes a string', async () => {
    const onChange = vi.fn();
    render(<MarkdownEditor value="" onChange={onChange} />);

    await screen.findByTestId('md-editor');

    act(() => {
      capturedOnChange?.('hello');
    });

    expect(onChange).toHaveBeenCalledWith('hello');
  });

  it('calls onChange with empty string when MDEditor passes undefined', async () => {
    const onChange = vi.fn();
    render(<MarkdownEditor value="" onChange={onChange} />);

    await screen.findByTestId('md-editor');

    act(() => {
      capturedOnChange?.(undefined);
    });

    expect(onChange).toHaveBeenCalledWith('');
  });
});
