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
        onDeleteThread={vi.fn()}
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
          { id: 'thread-1', title: 'First thread', createdByEmail: 'alice@example.com', createdAt: '2026-02-18T10:00:00Z' },
          { id: 'thread-2', title: 'Second thread', createdByEmail: 'bob@example.com', createdAt: '2026-02-17T10:00:00Z' },
        ]}
        activeThreadId="thread-2"
        onSelectThread={onSelectThread}
        onDeleteThread={vi.fn()}
      />,
    );

    expect(screen.getByText('Threads (2)')).toBeInTheDocument();

    const secondButton = screen.getByText('Second thread').closest('button')!;
    const firstButton = screen.getByText('First thread').closest('button')!;
    expect(secondButton).toHaveAttribute('aria-pressed', 'true');
    expect(firstButton).toHaveAttribute('aria-pressed', 'false');

    await user.click(firstButton);
    expect(onSelectThread).toHaveBeenCalledWith('thread-1');
  });

  it('renders email prefix below title', () => {
    render(
      <ThreadRail
        threads={[
          { id: 'thread-1', title: 'Draft email', createdByEmail: 'sarah@pavinfo.com', createdAt: '2026-02-18T10:00:00Z' },
        ]}
        activeThreadId={null}
        onSelectThread={vi.fn()}
        onDeleteThread={vi.fn()}
      />,
    );

    expect(screen.getByText('Draft email')).toBeInTheDocument();
    expect(screen.getByText('sarah')).toBeInTheDocument();
  });

  it('does not render email line when createdByEmail is null', () => {
    render(
      <ThreadRail
        threads={[
          { id: 'thread-1', title: 'Draft email', createdByEmail: null, createdAt: '2026-02-18T10:00:00Z' },
        ]}
        activeThreadId={null}
        onSelectThread={vi.fn()}
        onDeleteThread={vi.fn()}
      />,
    );

    expect(screen.getByText('Draft email')).toBeInTheDocument();
    expect(screen.queryByText('sarah')).not.toBeInTheDocument();
  });

  it('renders relative date for threads', () => {
    const today = new Date().toISOString();
    render(
      <ThreadRail
        threads={[
          { id: 'thread-1', title: 'Today thread', createdByEmail: null, createdAt: today },
        ]}
        activeThreadId={null}
        onSelectThread={vi.fn()}
        onDeleteThread={vi.fn()}
      />,
    );

    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('filters threads by search input', async () => {
    const user = userEvent.setup();
    render(
      <ThreadRail
        threads={[
          { id: 'thread-1', title: 'Welcome email draft', createdByEmail: null, createdAt: '2026-02-18T10:00:00Z' },
          { id: 'thread-2', title: 'Instagram post', createdByEmail: null, createdAt: '2026-02-17T10:00:00Z' },
        ]}
        activeThreadId={null}
        onSelectThread={vi.fn()}
        onDeleteThread={vi.fn()}
      />,
    );

    const searchInput = screen.getByLabelText('Search threads');
    await user.type(searchInput, 'instagram');

    expect(screen.getByText('Instagram post')).toBeInTheDocument();
    expect(screen.queryByText('Welcome email draft')).not.toBeInTheDocument();
  });

  it('shows all threads when search is cleared', async () => {
    const user = userEvent.setup();
    render(
      <ThreadRail
        threads={[
          { id: 'thread-1', title: 'Welcome email draft', createdByEmail: null, createdAt: '2026-02-18T10:00:00Z' },
          { id: 'thread-2', title: 'Instagram post', createdByEmail: null, createdAt: '2026-02-17T10:00:00Z' },
        ]}
        activeThreadId={null}
        onSelectThread={vi.fn()}
        onDeleteThread={vi.fn()}
      />,
    );

    const searchInput = screen.getByLabelText('Search threads');
    await user.type(searchInput, 'instagram');
    expect(screen.queryByText('Welcome email draft')).not.toBeInTheDocument();

    await user.click(screen.getByLabelText('Clear search'));
    expect(screen.getByText('Welcome email draft')).toBeInTheDocument();
    expect(screen.getByText('Instagram post')).toBeInTheDocument();
  });

  it('allows two-line wrapping for long titles', () => {
    render(
      <ThreadRail
        threads={[
          { id: 'thread-1', title: 'This is a very long thread title that should wrap to two lines', createdByEmail: null, createdAt: '2026-02-18T10:00:00Z' },
        ]}
        activeThreadId={null}
        onSelectThread={vi.fn()}
        onDeleteThread={vi.fn()}
      />,
    );

    const titleElement = screen.getByText('This is a very long thread title that should wrap to two lines');
    expect(titleElement).toHaveClass('line-clamp-2');
  });

  it('renders a delete button for each thread', () => {
    render(
      <ThreadRail
        threads={[
          { id: 'thread-1', title: 'First thread', createdByEmail: null, createdAt: '2026-02-18T10:00:00Z' },
          { id: 'thread-2', title: 'Second thread', createdByEmail: null, createdAt: '2026-02-17T10:00:00Z' },
        ]}
        activeThreadId={null}
        onSelectThread={vi.fn()}
        onDeleteThread={vi.fn()}
      />,
    );

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete thread' });
    expect(deleteButtons).toHaveLength(2);
  });

  it('calls onDeleteThread with the correct id after confirmation', async () => {
    const user = userEvent.setup();
    const onDeleteThread = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <ThreadRail
        threads={[
          { id: 'thread-1', title: 'First thread', createdByEmail: null, createdAt: '2026-02-18T10:00:00Z' },
          { id: 'thread-2', title: 'Second thread', createdByEmail: null, createdAt: '2026-02-17T10:00:00Z' },
        ]}
        activeThreadId={null}
        onSelectThread={vi.fn()}
        onDeleteThread={onDeleteThread}
      />,
    );

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete thread' });
    await user.click(deleteButtons[0]);

    expect(onDeleteThread).toHaveBeenCalledWith('thread-1');
  });

  it('does not call onDeleteThread when confirmation is cancelled', async () => {
    const user = userEvent.setup();
    const onDeleteThread = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(
      <ThreadRail
        threads={[
          { id: 'thread-1', title: 'First thread', createdByEmail: null, createdAt: '2026-02-18T10:00:00Z' },
        ]}
        activeThreadId={null}
        onSelectThread={vi.fn()}
        onDeleteThread={onDeleteThread}
      />,
    );

    const deleteButton = screen.getByRole('button', { name: 'Delete thread' });
    await user.click(deleteButton);

    expect(onDeleteThread).not.toHaveBeenCalled();
  });
});
