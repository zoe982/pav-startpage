import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

vi.mock('@lit/react', () => ({
  createComponent: ({ tagName }: { tagName: string }) => {
    const elementType: 'button' | 'input' | 'div' = tagName.includes('text-field')
      ? 'input'
      : tagName.includes('card')
        ? 'div'
        : 'button';

    return function MockMaterialComponent({
      children,
      onInput,
      ...props
    }: {
      readonly children?: React.ReactNode;
      readonly onInput?: (event: Event) => void;
      readonly [key: string]: unknown;
    }) {
      const forwardedProps = {
        ...props,
        onInput: onInput as unknown,
      };
      return React.createElement(elementType, forwardedProps, children);
    };
  },
}));

import {
  M3ElevatedCard,
  M3FilledTonalButton,
  M3IconButton,
  M3OutlinedTextField,
  M3TextButton,
} from '../../../src/components/m3/material.tsx';

describe('M3 material adapters', () => {
  it('renders text and filled tonal buttons with click handlers and metadata', () => {
    const onTextClick = vi.fn();
    const onFilledClick = vi.fn();

    const { container } = render(
      <div>
        <M3TextButton onClick={onTextClick} dataTestId="text-button-test" ariaLabel="Text action">
          Text action
        </M3TextButton>
        <M3FilledTonalButton onClick={onFilledClick} dataTestId="filled-button-test" type="submit" ariaLabel="Filled action">
          Filled action
        </M3FilledTonalButton>
      </div>,
    );

    const textButton = screen.getByTestId('text-button-test');
    const filledButton = screen.getByTestId('filled-button-test');
    expect(textButton).toHaveAttribute('data-m3-component', 'text-button');
    expect(filledButton).toHaveAttribute('data-m3-component', 'filled-tonal-button');
    expect(filledButton).toHaveAttribute('type', 'submit');

    fireEvent.click(container.querySelectorAll('span')[0]);
    fireEvent.click(container.querySelectorAll('span')[1]);
    expect(onTextClick).toHaveBeenCalledTimes(1);
    expect(onFilledClick).toHaveBeenCalledTimes(1);
  });

  it('renders icon button and elevated card', () => {
    const onIconClick = vi.fn();

    const { container } = render(
      <div>
        <M3IconButton onClick={onIconClick} dataTestId="icon-button-test" ariaLabel="Icon action">
          <span>Icon</span>
        </M3IconButton>
        <M3ElevatedCard dataTestId="elevated-card-test">
          <p>Card body</p>
        </M3ElevatedCard>
      </div>,
    );

    expect(screen.getByTestId('icon-button-test')).toHaveAttribute('data-m3-component', 'icon-button');
    expect(screen.getByTestId('elevated-card-test')).toHaveAttribute('data-m3-component', 'elevated-card');
    fireEvent.click(container.querySelectorAll('span')[0]);
    expect(onIconClick).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Card body')).toBeInTheDocument();
  });

  it('renders outlined text field, supports refs, and emits value changes', () => {
    const objectRef = { current: null as unknown };
    const functionRef = vi.fn();
    const onValueChange = vi.fn();

    const { rerender } = render(
      <M3OutlinedTextField
        ref={objectRef}
        value="hello"
        onValueChange={onValueChange}
        dataTestId="outlined-field-test"
        placeholder="Type here"
        ariaLabel="Outlined field"
        name="search-field"
        id="outlined-field"
        role="searchbox"
      />,
    );

    const field = screen.getByTestId('outlined-field-test');
    expect(field).toHaveAttribute('data-m3-component', 'outlined-text-field');
    expect(field).toHaveAttribute('placeholder', 'Type here');
    expect(field).toHaveAttribute('name', 'search-field');
    expect(field).toHaveAttribute('id', 'outlined-field');
    expect(field).toHaveAttribute('role', 'searchbox');
    expect(objectRef.current).not.toBeNull();

    onValueChange.mockClear();
    (field as HTMLInputElement).value = 'updated value';
    fireEvent.input(field);
    expect(onValueChange).toHaveBeenCalledWith('updated value');

    rerender(
      <M3OutlinedTextField
        ref={functionRef}
        value="second"
        onValueChange={onValueChange}
        ariaLabel="Outlined field without test id"
      />,
    );

    expect(functionRef).toHaveBeenCalled();
    expect(screen.getByLabelText('Outlined field without test id')).toBeInTheDocument();

    rerender(
      <M3OutlinedTextField
        value="third"
        onValueChange={onValueChange}
        ariaLabel="Outlined field with no ref"
      />,
    );
    expect(screen.getByLabelText('Outlined field with no ref')).toBeInTheDocument();
  });

  it('uses default button types when omitted', () => {
    render(
      <div>
        <M3TextButton dataTestId="default-text-button">Default text</M3TextButton>
        <M3FilledTonalButton dataTestId="default-filled-button">Default filled</M3FilledTonalButton>
      </div>,
    );

    expect(screen.getByTestId('default-text-button')).toHaveAttribute('type', 'button');
    expect(screen.getByTestId('default-filled-button')).toHaveAttribute('type', 'button');
  });
});
