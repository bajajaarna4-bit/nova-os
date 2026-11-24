// keyboard.ts — Global keyboard shortcut handling for NOVA desktop shell

type ShortcutHandler = () => void;

class GlobalKeyboardManager {
  private handlers: Map<string, ShortcutHandler> = new Map();
  private boundListener: (e: KeyboardEvent) => void;

  constructor() {
    this.boundListener = this.onKeyDown.bind(this);
    window.addEventListener('keydown', this.boundListener);
  }

  register(keyCombo: string, handler: ShortcutHandler) {
    this.handlers.set(keyCombo.toLowerCase(), handler);
  }

  unregister(keyCombo: string) {
    this.handlers.delete(keyCombo.toLowerCase());
  }

  destroy() {
    window.removeEventListener('keydown', this.boundListener);
  }

  private onKeyDown(e: KeyboardEvent) {
    const isSuper = e.metaKey || (e.key === 'Meta');
    const isCtrl = e.ctrlKey;
    const isAlt = e.altKey;

    let combo = '';
    if (isSuper) combo += 'super+';
    if (isCtrl) combo += 'ctrl+';
    if (isAlt) combo += 'alt+';

    if (e.key === 'Meta') {
      combo = 'super';
    } else {
      combo += e.key.toLowerCase();
    }

    if (this.handlers.has(combo)) {
      e.preventDefault();
      this.handlers.get(combo)!();
    }
  }
}

export const globalKeyboard = new GlobalKeyboardManager();
