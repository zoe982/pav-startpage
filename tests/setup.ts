import '@testing-library/jest-dom/vitest';

if (!HTMLElement.prototype.scrollTo) {
  HTMLElement.prototype.scrollTo = () => {};
}

type MutableElementInternals = {
  setFormValue?: (value: File | FormData | string | null, state?: File | FormData | string | null) => void;
  setValidity?: (flags?: ValidityStateFlags, message?: string, anchor?: HTMLElement | null) => void;
  checkValidity?: () => boolean;
  reportValidity?: () => boolean;
};

function patchElementInternals(target: unknown): void {
  if (!target || typeof target !== 'object') return;
  const internals = target as MutableElementInternals;

  if (!internals.setFormValue) {
    internals.setFormValue = () => {};
  }
  if (!internals.setValidity) {
    internals.setValidity = () => {};
  }
  if (!internals.checkValidity) {
    internals.checkValidity = () => true;
  }
  if (!internals.reportValidity) {
    internals.reportValidity = () => true;
  }
}

const maybeElementInternals = globalThis.ElementInternals;
if (maybeElementInternals) {
  patchElementInternals(maybeElementInternals.prototype);
}

if (!HTMLElement.prototype.attachInternals) {
  HTMLElement.prototype.attachInternals = function attachInternals(): ElementInternals {
    const fallbackInternals = {
      form: null,
      labels: [] as readonly HTMLElement[],
      shadowRoot: null,
      states: new Set<string>(),
      validationMessage: '',
      validity: {} as ValidityState,
      willValidate: true,
      setFormValue: () => {},
      setValidity: () => {},
      checkValidity: () => true,
      reportValidity: () => true,
    } as unknown as ElementInternals;
    return fallbackInternals;
  };
} else {
  const originalAttachInternals = HTMLElement.prototype.attachInternals;
  HTMLElement.prototype.attachInternals = function patchedAttachInternals(): ElementInternals {
    const internals = originalAttachInternals.call(this);
    patchElementInternals(internals);
    return internals;
  };
}
