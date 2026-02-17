import type { JSX, SyntheticEvent } from 'react';

interface ComposerBarProps {
  readonly message: string;
  readonly isLoading: boolean;
  readonly onMessageChange: (value: string) => void;
  readonly onSubmit: () => Promise<void>;
}

export function ComposerBar({
  message,
  isLoading,
  onMessageChange,
  onSubmit,
}: ComposerBarProps): JSX.Element {
  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    await onSubmit();
  };

  return (
    <form onSubmit={(event) => { void handleSubmit(event); }} className="space-y-3 rounded-2xl border border-outline-variant/70 bg-surface p-3 shadow-[var(--shadow-elevation-1)]">
      <input
        type="text"
        aria-label="Revision message"
        value={message}
        onChange={(event) => {
          onMessageChange(event.target.value);
        }}
        className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading || message.trim().length === 0}
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-on-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          Send revision
        </button>
      </div>
    </form>
  );
}
