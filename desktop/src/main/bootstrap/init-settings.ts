import { SettingsService } from '../settings/settings.service';

export async function initSettings(): Promise<SettingsService> {
  const service = new SettingsService();
  await service.load();
  return service;
}
