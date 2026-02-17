import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ManageBrandRulesPage } from '../../../src/pages/admin/ManageBrandRulesPage.tsx';
import { renderWithProviders, mockAdminUser } from '../../helpers.tsx';

vi.mock('../../../src/api/brandVoice.ts', () => ({
  fetchBrandRules: vi.fn(),
  updateBrandRules: vi.fn(),
}));

vi.mock('../../../src/components/wiki/MarkdownEditor.tsx', () => ({
  MarkdownEditor: ({
    value,
    onChange,
  }: {
    readonly value: string;
    readonly onChange: (value: string) => void;
  }) => (
    <textarea
      data-testid="markdown-editor"
      value={value}
      onChange={(event) => {
        onChange(event.target.value);
      }}
    />
  ),
}));

import { fetchBrandRules, updateBrandRules } from '../../../src/api/brandVoice.ts';

describe('ManageBrandRulesPage', () => {
  const addToast = vi.fn();

  beforeEach(() => {
    vi.mocked(fetchBrandRules).mockReset();
    vi.mocked(updateBrandRules).mockReset();
    addToast.mockReset();
  });

  function renderPage(): void {
    renderWithProviders(<ManageBrandRulesPage />, {
      auth: { user: mockAdminUser(), isAuthenticated: true },
      toast: { addToast },
      route: '/admin/brand-rules',
    });
  }

  it('shows loading skeleton while rules are loading', () => {
    vi.mocked(fetchBrandRules).mockReturnValue(new Promise(() => {}));

    const { container } = renderWithProviders(<ManageBrandRulesPage />, {
      auth: { user: mockAdminUser(), isAuthenticated: true },
      toast: { addToast },
      route: '/admin/brand-rules',
    });

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows error toast when initial load fails', async () => {
    vi.mocked(fetchBrandRules).mockRejectedValue(new Error('load failed'));

    renderPage();

    await waitFor(() => {
      expect(addToast).toHaveBeenCalledWith('Failed to load brand rules', 'error');
    });
  });

  it('loads voice rules and saves updated voice markdown', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchBrandRules).mockResolvedValue({
      rulesMarkdown: '# Voice Rules',
      servicesMarkdown: '# Services Facts',
    });
    vi.mocked(updateBrandRules).mockResolvedValue({
      rulesMarkdown: '# Updated',
      servicesMarkdown: '# Services Facts',
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Voice Guide')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('markdown-editor'), {
      target: { value: '# Updated Voice Rules' },
    });
    await user.click(screen.getByRole('button', { name: 'Save All' }));

    await waitFor(() => {
      expect(updateBrandRules).toHaveBeenCalledWith({
        rulesMarkdown: '# Updated Voice Rules',
        servicesMarkdown: '# Services Facts',
      });
    });
    expect(addToast).toHaveBeenCalledWith('Brand settings saved', 'success');
  });

  it('switches to services tab and saves updated services markdown', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchBrandRules).mockResolvedValue({
      rulesMarkdown: '# Voice Rules',
      servicesMarkdown: '# Services Facts',
    });
    vi.mocked(updateBrandRules).mockResolvedValue({
      rulesMarkdown: '# Voice Rules',
      servicesMarkdown: '# Updated services',
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Services Description' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Services Description' }));
    expect(screen.getByText('Services Description (Markdown)')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Voice Guide' }));
    expect(screen.getByText('Brand Voice Guidelines (Markdown)')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Services Description' }));

    fireEvent.change(screen.getByTestId('markdown-editor'), {
      target: { value: '# Updated Services Facts' },
    });
    await user.click(screen.getByRole('button', { name: 'Save All' }));

    await waitFor(() => {
      expect(updateBrandRules).toHaveBeenCalledWith({
        rulesMarkdown: '# Voice Rules',
        servicesMarkdown: '# Updated Services Facts',
      });
    });
  });

  it('shows saving state and error toast when save fails', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchBrandRules).mockResolvedValue({
      rulesMarkdown: '# Voice Rules',
      servicesMarkdown: '# Services Facts',
    });

    let resolveUpdate: (() => void) | undefined;
    vi.mocked(updateBrandRules).mockImplementation(
      () => new Promise((_resolve, reject) => {
        resolveUpdate = () => {
          reject(new Error('save failed'));
        };
      }),
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save All' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Save All' }));
    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();

    resolveUpdate?.();

    await waitFor(() => {
      expect(addToast).toHaveBeenCalledWith('Failed to save brand settings', 'error');
    });
  });
});
