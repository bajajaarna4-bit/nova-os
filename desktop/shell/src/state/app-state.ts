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
  workspace: number;
}

export interface AppDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'system' | 'tools' | 'ai';
  defaultW: number;
  defaultH: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'warn' | 'success';
}

export const APPS: Record<string, AppDefinition> = {
  'terminal': {
    id: 'terminal',
    name: 'Terminal',
    description: 'Sandboxed developer shell environment',
    icon: '⚡',
    category: 'tools',
    defaultW: 700,
    defaultH: 430,
  },
  'files': {
    id: 'files',
    name: 'Files',
    description: 'Local filesystem manager with permission scoping',
    icon: '📁',
    category: 'system',
    defaultW: 780,
    defaultH: 500,
  },
  'settings': {
    id: 'settings',
    name: 'Settings',
    description: 'Display, themes, privacy, and system configuration',
    icon: '⚙️',
    category: 'system',
    defaultW: 840,
    defaultH: 540,
  },
  'security': {
    id: 'security',
    name: 'Security Center',
    description: 'Integrity posture, SELinux enforcement, and firewall',
    icon: '🛡️',
    category: 'system',
    defaultW: 820,
    defaultH: 520,
  },
  'ai-assistant': {
    id: 'ai-assistant',
    name: 'NOVA Intelligence',
    description: 'Local-first private assistant with allowlisted tools',
    icon: '✨',
    category: 'ai',
    defaultW: 560,
    defaultH: 640,
  },
};

type Listener = (val: any) => void;

class AppStateManager {
  private windows: WindowInstance[] = [];
  private currentZ = 10;
  private currentWorkspace = 1;
  private notifications: NotificationItem[] = [
    {
      id: '1',
      title: 'Zero-Trust Confinement',
      message: 'SELinux domain nova_core_t is strictly enforced.',
      time: 'Just now',
      type: 'info',
    },
    {
      id: '2',
      title: 'NOVA Intelligence Active',
      message: 'Tool execution sandbox verified and ready.',
      time: '2m ago',
      type: 'success',
    },
  ];
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

  getVisibleWindows(): WindowInstance[] {
    return this.windows.filter(w => w.workspace === this.currentWorkspace);
  }

  getWorkspace(): number {
    return this.currentWorkspace;
  }

  setWorkspace(n: number) {
    this.currentWorkspace = n;
    this.notify('workspace', this.currentWorkspace);
    this.notify('windows', this.windows);
  }

  openApp(appId: string) {
    const existing = this.windows.find(w => w.appId === appId);
    if (existing) {
      if (existing.workspace !== this.currentWorkspace) {
        this.setWorkspace(existing.workspace);
      }
      if (existing.minimized) existing.minimized = false;
      this.focusWindow(existing.windowId);
      return;
    }

    const app = APPS[appId] || {
      id: appId,
      name: appId,
      description: '',
      icon: '📦',
      category: 'tools',
      defaultW: 640,
      defaultH: 440,
    };

    const offset = (this.windows.length % 6) * 32;
    this.currentZ += 1;

    let initX = 100 + offset;
    let initY = 60 + offset;
    if (appId === 'ai-assistant' && typeof window !== 'undefined' && window.innerWidth > 1200) {
      initX = Math.max(100, window.innerWidth - app.defaultW - 48);
      initY = 60;
    }

    const newWin: WindowInstance = {
      windowId: `${appId}-${Date.now()}`,
      appId,
      title: app.name,
      x: initX,
      y: initY,
      w: app.defaultW,
      h: app.defaultH,
      zIndex: this.currentZ,
      focused: true,
      minimized: false,
      workspace: this.currentWorkspace,
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

  snapWindow(windowId: string, side: 'left' | 'right' | 'maximize' | 'restore') {
    const w = this.windows.find(win => win.windowId === windowId);
    if (!w) return;

    const topBarHeight = 40;
    const dockHeight = 72;
    const availableW = window.innerWidth;
    const availableH = window.innerHeight - topBarHeight - dockHeight;

    if (side === 'left') {
      w.x = 0;
      w.y = 0;
      w.w = Math.floor(availableW / 2);
      w.h = availableH;
    } else if (side === 'right') {
      w.x = Math.floor(availableW / 2);
      w.y = 0;
      w.w = Math.floor(availableW / 2);
      w.h = availableH;
    } else if (side === 'maximize') {
      w.x = 0;
      w.y = 0;
      w.w = availableW;
      w.h = availableH;
    }
    this.focusWindow(windowId);
  }

  getNotifications(): NotificationItem[] {
    return this.notifications;
  }

  pushNotification(item: Omit<NotificationItem, 'id' | 'time'>) {
    const notif: NotificationItem = {
      ...item,
      id: `${Date.now()}-${Math.random()}`,
      time: 'Just now',
    };
    this.notifications.unshift(notif);
    this.notify('notifications', this.notifications);
  }

  clearNotifications() {
    this.notifications = [];
    this.notify('notifications', this.notifications);
  }
}

export const appState = new AppStateManager();
