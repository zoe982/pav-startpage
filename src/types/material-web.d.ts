import type { DetailedHTMLProps, HTMLAttributes } from 'react';

type MaterialElementProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'md-filled-button': MaterialElementProps & {
        disabled?: boolean;
        type?: 'button' | 'submit' | 'reset';
      };
      'md-outlined-button': MaterialElementProps & {
        disabled?: boolean;
        type?: 'button' | 'submit' | 'reset';
      };
      'md-text-button': MaterialElementProps & {
        disabled?: boolean;
        type?: 'button' | 'submit' | 'reset';
      };
      'md-filled-text-field': MaterialElementProps & {
        label?: string;
        value?: string;
        disabled?: boolean;
      };
      'md-outlined-text-field': MaterialElementProps & {
        label?: string;
        value?: string;
        disabled?: boolean;
      };
      'md-filter-chip': MaterialElementProps & {
        selected?: boolean;
        disabled?: boolean;
      };
      'md-assist-chip': MaterialElementProps & {
        selected?: boolean;
        disabled?: boolean;
      };
      'md-dialog': MaterialElementProps & {
        open?: boolean;
      };
      'md-tabs': MaterialElementProps;
      'md-primary-tab': MaterialElementProps & {
        active?: boolean;
      };
      'md-circular-progress': MaterialElementProps & {
        indeterminate?: boolean;
      };
      'md-icon': MaterialElementProps;
    }
  }
}

export {};
