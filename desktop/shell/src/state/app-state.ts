// app-state.ts — Centralized reactive state store for NOVA desktop shell

export interface WindowInstance {
  windowId: string;
  appId: string;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
  focused: boolean;
  minimized: boolean;
}

export interface AppDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  defaultW: number;
  defaultH: number;
}

export const APPS: Record<string, AppDefinition> = {
  'terminal': {
    id: 'terminal',
    name: 'Terminal',
    description: 'Sandboxed shell environment',
    icon: '⚡',
    defaultW: 680,
    defaultH: 420,
  },
  'files': {
    id: 'files',
    name: 'Files',
    description: 'Local file manager with permission scoping',
    icon: '📁',
    defaultW: 760,
    defaultH: 480,
  },
  'settings': {
    id: 'settings',
    name: 'Settings',
    description: 'System appearance, display, and privacy',
    icon: '⚙️',
    defaultW: 820,
    defaultH: 520,
  },
  'security': {
    id: 'security',
    name: 'Security Center',
    description: 'Integrity, SELinux, and isolation status',
    icon: '🛡️',
    defaultW: 800,
    defaultH: 540,
  },
  'ai-assistant': {
    id: 'ai-assistant',
    name: 'NOVA Intelligence',
    description: 'Local-first private system assistant',
    icon: '✨',
    defaultW: 520,
    defaultH: 620,
  },
};

type Listener = (val: any) => void;

class AppStateManager {
  private windows: WindowInstance[] = [];
  private currentZ = 10;
  private listeners: Map<string, Set<Listener>> = new Map();

  subscribe(key: string, fn: Listener) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(fn);
    return () => this.listeners.get(key)?.delete(fn);
  }

  private notify(key: string, val: any) {
    this.listeners.get(key)?.forEach(fn => fn(val));
  }

  getWindows(): WindowInstance[] {
    return this.windows;
  }

  openApp(appId: string) {
    const existing = this.windows.find(w => w.appId === appId);
    if (existing) {
      if (existing.minimized) existing.minimized = false;
      this.focusWindow(existing.windowId);
      return;
    }

    const app = APPS[appId] || {
      id: appId,
      name: appId,
      description: '',
      icon: '📦',
      defaultW: 640,
      defaultH: 440,
    };

    const offset = (this.windows.length % 6) * 32;
    this.currentZ += 1;

    const newWin: WindowInstance = {
      windowId: `${appId}-${Date.now()}`,
      appId,
      title: app.name,
      x: 120 + offset,
      y: 80 + offset,
      w: app.defaultW,
      h: app.defaultH,
      zIndex: this.currentZ,
      focused: true,
      minimized: false,
    };

    this.windows.forEach(w => { w.focused = false; });
    this.windows.push(newWin);
    this.notify('windows', this.windows);
  }

  focusWindow(windowId: string) {
    this.currentZ += 1;
    this.windows.forEach(w => {
      if (w.windowId === windowId) {
        w.focused = true;
        w.zIndex = this.currentZ;
      } else {
        w.focused = false;
      }
    });
    this.notify('windows', this.windows);
  }

  closeWindow(windowId: string) {
    this.windows = this.windows.filter(w => w.windowId !== windowId);
    if (this.windows.length > 0) {
      const highest = this.windows.reduce((max, w) => w.zIndex > max.zIndex ? w : max, this.windows[0]);
      highest.focused = true;
    }
    this.notify('windows', this.windows);
  }

  minimizeWindow(windowId: string) {
    const w = this.windows.find(win => win.windowId === windowId);
    if (w) {
      w.minimized = true;
      w.focused = false;
      this.notify('windows', this.windows);
    }
  }

  maximizeWindow(_windowId: string) {
    this.notify('windows', this.windows);
  }
}

export const appState = new AppStateManager();
