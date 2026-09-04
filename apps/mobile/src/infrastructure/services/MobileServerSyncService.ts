import AsyncStorage from '@react-native-async-storage/async-storage';
import { ServerClient } from '@music/core';
import type { Song, ServerHealth } from '@music/types';
import { SERVER_URL_KEY } from '../storage/keys';

export class MobileServerSyncService {
  /**
   * Retrieves the saved server URL from persistent storage.
   */
  static async getServerUrl(): Promise<string> {
    try {
      const url = await AsyncStorage.getItem(SERVER_URL_KEY);
      return url || '';
    } catch {
      return '';
    }
  }

  /**
   * Normalizes and saves the server URL to persistent storage.
   */
  static async setServerUrl(url: string): Promise<string> {
    const cleanUrl = ServerClient.normalizeUrl(url);
    await AsyncStorage.setItem(SERVER_URL_KEY, cleanUrl);
    return cleanUrl;
  }

  /**
   * Checks the health and connectivity of the server.
   */
  static async checkConnection(url?: string): Promise<{ ok: boolean; health?: ServerHealth; error?: string }> {
    const targetUrl = ServerClient.normalizeUrl(url || (await this.getServerUrl()));
    if (!targetUrl) {
      return { ok: false, error: 'Vui lòng nhập địa chỉ máy chủ hợp lệ' };
    }
    const result = await ServerClient.checkHealth(targetUrl);
    if (result.ok && result.health) {
      await AsyncStorage.setItem(SERVER_URL_KEY, targetUrl);
    }
    return result;
  }

  /**
   * Fetches all songs from the server.
   */
  static async fetchServerSongs(url?: string): Promise<{ ok: boolean; songs: Song[]; error?: string }> {
    const targetUrl = ServerClient.normalizeUrl(url || (await this.getServerUrl()));
    if (!targetUrl) {
      return { ok: false, songs: [], error: 'Vui lòng nhập địa chỉ máy chủ hợp lệ' };
    }
    return ServerClient.fetchSongs(targetUrl);
  }
}
