import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CopyButton } from '../../../src/components/templates/CopyButton.tsx';

const clipboardDescriptor = Object.getOwnPropertyDescriptor(globalThis.navigator, 'clipboard');

describe('CopyButton', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    if (clipboardDescriptor) {
      Object.defineProperty(globalThis.navigator, 'clipboard', clipboardDescriptor);
    }
  });

  it('copies text when clicked', async () => {
    const user = userEvent.setup();
    render(<CopyButton text="hello world" />);

    await user.click(screen.getByRole('button', { name: 'Copy' }));

    expect(screen.getByRole('button', { name: 'Copied!' })).toBeInTheDocument();
  });

  it('does not copy when disabled', async () => {
    const user = userEvent.setup();
    render(<CopyButton text="hello world" disabled />);

    const button = screen.getByRole('button', { name: 'Copy' });
    expect(button).toBeDisabled();

    await user.click(button);

    expect(screen.getByRole('button', { name: 'Copy' })).toBeDisabled();
  });
});
