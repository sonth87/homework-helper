import { ipcMain } from 'electron';
import { checkPermissions, openPermissionPane, relaunchApp } from '../permissions/permissions.service';
import type { PermissionKind } from '@shared/types/permissions';
import { openOnboardingWindow } from '../windows/onboarding.window';

export function registerPermissionsIpc(): void {
  ipcMain.handle('permissions:check', () => checkPermissions());
  ipcMain.handle('permissions:openPane', (_e, { kind }: { kind: PermissionKind }) => openPermissionPane(kind));
  ipcMain.handle('permissions:relaunch', () => relaunchApp());
  ipcMain.handle('windows:openOnboarding', () => void openOnboardingWindow());
}
