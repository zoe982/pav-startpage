import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThreadRail } from '../../../src/components/brandVoice/ThreadRail.tsx';

describe('ThreadRail', () => {
  it('shows empty state and zero count when no threads exist', () => {
    render(
      <ThreadRail
        threads={[]}
        activeThreadId={null}
        onSelectThread={vi.fn()}
      />,
    );

    expect(screen.getByText('Threads (0)')).toBeInTheDocument();
    expect(screen.getByText('No threads yet. Start with your first prompt.')).toBeInTheDocument();
  });

  it('shows thread list, marks active thread, and handles selection', async () => {
    const user = userEvent.setup();
    const onSelectThread = vi.fn();

    render(
      <ThreadRail
        threads={[
          { id: 'thread-1', title: 'First thread' },
          { id: 'thread-2', title: 'Second thread' },
        ]}
        activeThreadId="thread-2"
        onSelectThread={onSelectThread}
      />,
    );

    expect(screen.getByText('Threads (2)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Second thread' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'First thread' })).toHaveAttribute('aria-pressed', 'false');

    await user.click(screen.getByRole('button', { name: 'First thread' }));
    expect(onSelectThread).toHaveBeenCalledWith('thread-1');
  });
});
