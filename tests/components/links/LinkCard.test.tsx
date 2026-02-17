import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LinkCard } from '../../../src/components/links/LinkCard.tsx';
import { mockLink } from '../../helpers.tsx';

describe('LinkCard', () => {
  it('renders with elevated card wrapper semantics', () => {
    const { container } = render(<LinkCard link={mockLink({ title: 'Google', url: 'https://google.com' })} />);
    const card = container.querySelector('[data-m3-component="elevated-card"]');
    expect(card).toBeInTheDocument();
  });

  it('renders link title and URL', () => {
    render(<LinkCard link={mockLink({ title: 'Google', url: 'https://google.com' })} />);
    expect(screen.getByText('Google')).toBeInTheDocument();
    const anchor = screen.getByRole('link');
    expect(anchor).toHaveAttribute('href', 'https://google.com');
    expect(anchor).toHaveAttribute('target', '_blank');
    expect(anchor).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders icon image when iconUrl is provided', () => {
    const { container } = render(<LinkCard link={mockLink({ iconUrl: 'https://example.com/icon.png' })} />);
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/icon.png');
  });

  it('renders SVG icon for known services', () => {
    const { container } = render(
      <LinkCard link={mockLink({ title: 'Gmail', url: 'https://mail.google.com', iconUrl: null })} />,
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('gracefully handles missing SVG path even for known icon names', () => {
    const originalGetDescriptor = Object.getOwnPropertyDescriptor(Map.prototype, 'get');
    const originalGet = originalGetDescriptor?.value as
      | ((this: Map<string, string>, key: string) => string | undefined)
      | undefined;

    if (!originalGet) {
      throw new Error('Map.prototype.get is unavailable in this runtime');
    }

    const getSpy = vi.spyOn(Map.prototype, 'get').mockImplementation(function (key: string) {
      if (this instanceof Map && this.size > 20 && key === 'mail') {
        return undefined;
      }
      return Reflect.apply(originalGet, this, [key]) as string | undefined;
    });

    try {
      const { container } = render(
        <LinkCard link={mockLink({ title: 'Gmail', url: 'https://mail.google.com', iconUrl: null })} />,
      );
      expect(container.querySelector('svg')).not.toBeInTheDocument();
    } finally {
      getSpy.mockRestore();
    }
  });

  it('renders fallback letter when no icon matches', () => {
    render(<LinkCard link={mockLink({ title: 'Acme Portal', url: 'invalid', iconUrl: null })} />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('renders description when present', () => {
    render(<LinkCard link={mockLink({ description: 'A search engine' })} />);
    expect(screen.getByText('A search engine')).toBeInTheDocument();
  });

  it('does not render description when null', () => {
    render(<LinkCard link={mockLink({ description: null })} />);
    const paragraphs = screen.queryAllByText(/.+/);
    expect(paragraphs.every((p) => p.textContent !== 'null')).toBe(true);
  });
});
