import { fireEvent } from '@testing-library/react';

interface ValueHost extends HTMLElement {
  value?: string;
}

function asValueHost(hostElement: HTMLElement): ValueHost {
  return hostElement as ValueHost;
}

function getProxyInput(hostElement: HTMLElement): HTMLInputElement | null {
  const hostTestId = hostElement.getAttribute('data-testid');
  if (!hostTestId) return null;

  const proxyInput = document.querySelector(`input[data-testid="${hostTestId}__proxy"]`);
  return proxyInput instanceof HTMLInputElement ? proxyInput : null;
}

export function getMaterialTextFieldValue(hostElement: HTMLElement): string {
  const proxyInput = getProxyInput(hostElement);
  if (proxyInput) return proxyInput.value;

  if (hostElement instanceof HTMLInputElement) {
    return hostElement.value;
  }

  const maybeValue = asValueHost(hostElement).value;
  return typeof maybeValue === 'string' ? maybeValue : '';
}

export function setMaterialTextFieldValue(hostElement: HTMLElement, value: string): void {
  const proxyInput = getProxyInput(hostElement);
  if (proxyInput) {
    fireEvent.input(proxyInput, { target: { value } });
    fireEvent.change(proxyInput, { target: { value } });
    return;
  }

  if (hostElement instanceof HTMLInputElement) {
    fireEvent.input(hostElement, { target: { value } });
    fireEvent.change(hostElement, { target: { value } });
    return;
  }

  const valueHost = asValueHost(hostElement);
  valueHost.value = value;
  hostElement.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, data: value }));
  hostElement.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
}
