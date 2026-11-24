// desktop.test.ts — Unit tests for desktop shell state, services, and window management
import { describe, it, expect } from 'vitest';
import { appState, APPS } from '../state/app-state.js';
import { novaApi } from '../services/nova-api.js';

describe('NOVA OS Desktop Shell Core & Subsystems', () => {
  it('registers all required default applications', () => {
    expect(APPS['terminal']).toBeDefined();
    expect(APPS['files']).toBeDefined();
    expect(APPS['settings']).toBeDefined();
    expect(APPS['security']).toBeDefined();
    expect(APPS['ai-assistant']).toBeDefined();
  });

  it('manages window state and focus on launch', () => {
    appState.openApp('terminal');
    const windows = appState.getWindows();
    const term = windows.find(w => w.appId === 'terminal');
    expect(term).toBeDefined();
    expect(term?.focused).toBe(true);
    expect(term?.minimized).toBe(false);
  });

  it('handles workspace isolation correctly', () => {
    appState.setWorkspace(1);
    appState.openApp('terminal');
    appState.setWorkspace(2);
    appState.openApp('files');

    const ws1Windows = appState.getWindows().filter(w => w.workspace === 1);
    const ws2Windows = appState.getWindows().filter(w => w.workspace === 2);

    expect(ws1Windows.some(w => w.appId === 'terminal')).toBe(true);
    expect(ws2Windows.some(w => w.appId === 'files')).toBe(true);
  });

  it('snaps windows to half-screen layout', () => {
    appState.openApp('settings');
    const win = appState.getWindows().find(w => w.appId === 'settings')!;
    appState.snapWindow(win.windowId, 'left');
    expect(win.x).toBe(0);
    expect(win.w).toBeGreaterThan(0);
  });

  it('handles system notification dispatches', () => {
    const countBefore = appState.getNotifications().length;
    appState.pushNotification({
      title: 'Audit Warning',
      message: 'Sensitive file access detected.',
      type: 'warn',
    });
    const countAfter = appState.getNotifications().length;
    expect(countAfter).toBe(countBefore + 1);
    expect(appState.getNotifications()[0].title).toBe('Audit Warning');
  });

  it('grants and revokes zero-trust permissions', () => {
    novaApi.grantPermission('terminal', 'camera');
    expect(novaApi.isPermissionGranted('terminal', 'camera')).toBe(true);

    novaApi.revokePermission('terminal', 'camera');
    expect(novaApi.isPermissionGranted('terminal', 'camera')).toBe(false);
  });

  it('reads directory listings from filesystem API', async () => {
    const listing = await novaApi.listDirectory();
    expect(listing.items).toBeDefined();
    expect(Array.isArray(listing.items)).toBe(true);
    expect(listing.items.length).toBeGreaterThan(0);
  });

  it('processes AI queries with allowlisted tool proposals', async () => {
    const res = await novaApi.queryAI('Show system hardware stats');
    expect(res.text).toContain('Hardware Summary');
    expect(res.toolCall).toBeDefined();
    expect(res.toolCall?.name).toBe('get_system_info');
  });
});
