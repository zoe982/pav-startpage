import type { ButtonHTMLAttributes, ForwardedRef, InputHTMLAttributes, JSX, ReactNode } from 'react';
import React, { forwardRef } from 'react';
import { createComponent } from '@lit/react';
import { MdFilledTonalButton } from '@material/web/button/filled-tonal-button.js';
import { MdTextButton } from '@material/web/button/text-button.js';
import { MdIconButton } from '@material/web/iconbutton/icon-button.js';
import { MdElevatedCard } from '@material/web/labs/card/elevated-card.js';
import { MdOutlinedTextField } from '@material/web/textfield/outlined-text-field.js';

const MdTextButtonComponent = createComponent({
  react: React,
  tagName: 'md-text-button',
  elementClass: MdTextButton,
  events: {
    onClick: 'click',
  },
});

const MdFilledTonalButtonComponent = createComponent({
  react: React,
  tagName: 'md-filled-tonal-button',
  elementClass: MdFilledTonalButton,
  events: {
    onClick: 'click',
  },
});

const MdIconButtonComponent = createComponent({
  react: React,
  tagName: 'md-icon-button',
  elementClass: MdIconButton,
  events: {
    onClick: 'click',
  },
});

const MdOutlinedTextFieldComponent = createComponent({
  react: React,
  tagName: 'md-outlined-text-field',
  elementClass: MdOutlinedTextField,
  events: {
    onInput: 'input',
    onChange: 'change',
  },
});

const MdElevatedCardComponent = createComponent({
  react: React,
  tagName: 'md-elevated-card',
  elementClass: MdElevatedCard,
});

interface CommonM3Props {
  readonly className?: string;
  readonly children?: ReactNode;
  readonly dataTestId?: string;
  readonly ariaLabel?: string;
}

interface M3ButtonProps extends CommonM3Props {
  readonly disabled?: boolean;
  readonly type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
  readonly onClick?: () => void;
}

function getButtonType(type: ButtonHTMLAttributes<HTMLButtonElement>['type']): 'button' | 'submit' | 'reset' {
  return type ?? 'button';
}

function assignTestId(dataTestId: string | undefined): { 'data-testid'?: string } {
  return dataTestId ? { 'data-testid': dataTestId } : {};
}

function assignAriaLabel(ariaLabel: string | undefined): { 'aria-label'?: string } {
  return ariaLabel ? { 'aria-label': ariaLabel } : {};
}

export function M3TextButton({
  children,
  className,
  disabled,
  type,
  onClick,
  dataTestId,
  ariaLabel,
}: M3ButtonProps): JSX.Element {
  return (
    <span onClick={onClick}>
      <MdTextButtonComponent
        className={className}
        disabled={disabled ?? false}
        type={getButtonType(type)}
        role="button"
        data-m3-component="text-button"
        {...assignAriaLabel(ariaLabel)}
        {...assignTestId(dataTestId)}
      >
        {children}
      </MdTextButtonComponent>
    </span>
  );
}

export function M3FilledTonalButton({
  children,
  className,
  disabled,
  type,
  onClick,
  dataTestId,
  ariaLabel,
}: M3ButtonProps): JSX.Element {
  return (
    <span onClick={onClick}>
      <MdFilledTonalButtonComponent
        className={className}
        disabled={disabled ?? false}
        type={getButtonType(type)}
        role="button"
        data-m3-component="filled-tonal-button"
        {...assignAriaLabel(ariaLabel)}
        {...assignTestId(dataTestId)}
      >
        {children}
      </MdFilledTonalButtonComponent>
    </span>
  );
}

interface M3IconButtonProps extends CommonM3Props {
  readonly disabled?: boolean;
  readonly onClick?: () => void;
}

export function M3IconButton({
  children,
  className,
  disabled,
  onClick,
  dataTestId,
  ariaLabel,
}: M3IconButtonProps): JSX.Element {
  return (
    <span onClick={onClick}>
      <MdIconButtonComponent
        className={className}
        disabled={disabled ?? false}
        role="button"
        data-m3-component="icon-button"
        {...assignAriaLabel(ariaLabel)}
        {...assignTestId(dataTestId)}
      >
        {children}
      </MdIconButtonComponent>
    </span>
  );
}

export type MaterialTextFieldRef = HTMLInputElement | MdOutlinedTextField;

type SupportedTextFieldType = 'text' | 'email' | 'number' | 'password' | 'search' | 'tel' | 'url';

interface M3OutlinedTextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'ref' | 'type'> {
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly type?: SupportedTextFieldType;
  readonly ariaLabel?: string;
  readonly dataTestId?: string;
}

function setForwardedRef(
  ref: ForwardedRef<MaterialTextFieldRef>,
  value: MaterialTextFieldRef | null,
): void {
  if (typeof ref === 'function') {
    ref(value);
    return;
  }

  if (ref) {
    ref.current = value;
  }
}

export const M3OutlinedTextField = forwardRef<MaterialTextFieldRef, M3OutlinedTextFieldProps>(function M3OutlinedTextField(
  {
    value,
    onValueChange,
    className,
    disabled,
    type,
    placeholder,
    autoFocus,
    ariaLabel,
    dataTestId,
    name,
    id,
    role,
  },
  ref,
): JSX.Element {
  const proxyTestId = dataTestId ? `${dataTestId}__proxy` : undefined;

  return (
    <>
      <MdOutlinedTextFieldComponent
        className={className}
        disabled={disabled ?? false}
        type={type ?? 'text'}
        {...assignAriaLabel(ariaLabel)}
        {...(placeholder !== undefined ? { placeholder } : {})}
        {...(autoFocus ? { autoFocus: true } : {})}
        {...(name !== undefined ? { name } : {})}
        {...(id !== undefined ? { id } : {})}
        {...(role !== undefined ? { role } : {})}
        ref={(element: MdOutlinedTextField | null) => { setForwardedRef(ref, element); }}
        value={value}
        data-m3-component="outlined-text-field"
        {...assignTestId(dataTestId)}
        onInput={(event: Event) => {
          const target = event.currentTarget as MdOutlinedTextField;
          onValueChange(target.value);
        }}
      />
      <input
        aria-hidden="true"
        tabIndex={-1}
        value={value}
        onChange={(event) => { onValueChange(event.currentTarget.value); }}
        data-m3-proxy-for={dataTestId}
        {...assignTestId(proxyTestId)}
        style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
      />
    </>
  );
});

interface M3ElevatedCardProps {
  readonly className?: string;
  readonly children: ReactNode;
  readonly dataTestId?: string;
}

export function M3ElevatedCard({ className, children, dataTestId }: M3ElevatedCardProps): JSX.Element {
  return (
    <MdElevatedCardComponent
      className={className}
      data-m3-component="elevated-card"
      {...assignTestId(dataTestId)}
    >
      {children}
    </MdElevatedCardComponent>
  );
}
