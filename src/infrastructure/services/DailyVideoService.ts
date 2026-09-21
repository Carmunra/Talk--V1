export class DailyVideoService {
  /**
   * Generates or fetches a Daily Prebuilt room URL for a given lesson
   */
  public static async getOrCreateRoomUrl(lessonId: string): Promise<string> {
    const dailyApiKey = process.env.DAILY_API_KEY;
    const roomName = `talke-${lessonId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

    if (dailyApiKey) {
      try {
        const res = await fetch('https://api.daily.co/v1/rooms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${dailyApiKey}`,
          },
          body: JSON.stringify({
            name: roomName,
            properties: {
              enable_chat: true,
              enable_screenshare: true,
              start_video_off: false,
              start_audio_off: false,
              exp: Math.floor(Date.now() / 1000) + 7200, // 2h expiry
            },
          }),
        });

        if (res.ok) {
          const data = (await res.json()) as { url?: string };
          if (data.url) return data.url;
        }
      } catch (err) {
        console.warn('[DailyVideoService] Failed to create live Daily room via API, using fallback:', err);
      }
    }

    const domain = process.env.DAILY_DOMAIN || 'talke';
    return `https://${domain}.daily.co/${roomName}`;
  }
}
