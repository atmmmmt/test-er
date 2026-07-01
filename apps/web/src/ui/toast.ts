export type ToastType = 'success' | 'error' | 'info';

export type ToastMessage = {
  id: string;
  type: ToastType;
  text: string;
};

export function showToast(text: string, type: ToastType = 'info') {
  window.dispatchEvent(new CustomEvent('app-toast', { detail: { id: crypto.randomUUID(), type, text } }));
}
