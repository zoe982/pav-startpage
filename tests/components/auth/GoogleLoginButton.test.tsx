import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GoogleLoginButton } from '../../../src/components/auth/GoogleLoginButton.tsx';

describe('GoogleLoginButton', () => {
  it('renders a link to /api/auth/login', () => {
    render(<GoogleLoginButton />);
    const link = screen.getByRole('link', { name: /sign in with google/i });
    expect(link).toHaveAttribute('href', '/api/auth/login');
  });

  it('contains SVG icon', () => {
    const { container } = render(<GoogleLoginButton />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
