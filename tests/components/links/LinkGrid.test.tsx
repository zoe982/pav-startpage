import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LinkGrid } from '../../../src/components/links/LinkGrid.tsx';
import { mockLink } from '../../helpers.tsx';

describe('LinkGrid', () => {
  it('renders empty state when no links', () => {
    render(<LinkGrid links={[]} />);
    expect(screen.getByText('No links available yet.')).toBeInTheDocument();
  });

  it('renders link cards when links exist', () => {
    const links = [
      mockLink({ id: '1', title: 'Link A' }),
      mockLink({ id: '2', title: 'Link B' }),
    ];
    render(<LinkGrid links={links} />);
    expect(screen.getByText('Link A')).toBeInTheDocument();
    expect(screen.getByText('Link B')).toBeInTheDocument();
  });
});
