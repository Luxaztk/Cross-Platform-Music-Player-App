import { describe, it, expect } from 'vitest';
import { botT } from '@music/i18n';
import { GuildLanguageStore } from '../src/services/GuildLanguageStore.js';

describe('Discord Bot i18n & GuildLanguageStore', () => {
  it('should return Vietnamese translations by default', () => {
    expect(botT('vi', 'btn.pause')).toBe('Tạm dừng');
    expect(botT('vi', 'btn.resume')).toBe('Tiếp tục');
    expect(botT('vi', 'cmd.ping.title')).toBe('Thông số độ trễ');
  });

  it('should return English translations when lang is en', () => {
    expect(botT('en', 'btn.pause')).toBe('Pause');
    expect(botT('en', 'btn.resume')).toBe('Resume');
    expect(botT('en', 'cmd.ping.title')).toBe('Latency Metrics');
  });

  it('should replace dynamic variables correctly', () => {
    const res = botT('vi', 'common.requested_by', { user: 'Luxaztk' });
    expect(res).toBe('Yêu cầu bởi @Luxaztk');

    const resEn = botT('en', 'common.requested_by', { user: 'Luxaztk' });
    expect(resEn).toBe('Requested by @Luxaztk');
  });

  it('should manage guild language settings independently per guild', () => {
    // Dùng đường dẫn riêng để tránh đọc file guild_settings.json production
    const store = new GuildLanguageStore(':memory:');

    expect(store.getLanguage('guild-1')).toBe('vi');
    expect(store.getLanguage('guild-2')).toBe('vi');

    store.setLanguage('guild-1', 'en');
    expect(store.getLanguage('guild-1')).toBe('en');
    expect(store.getLanguage('guild-2')).toBe('vi');
  });
});
