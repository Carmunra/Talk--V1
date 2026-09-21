import { Request, Response } from 'express';

export class ConfigController {
  public static pilotMode(_req: Request, res: Response) {
    const isPilot = process.env.PILOT_MODE !== 'false';
    const hasStripe = Boolean(process.env.STRIPE_SECRET_KEY);
    const hasDaily = Boolean(process.env.DAILY_API_KEY);

    res.json({
      pilotMode: isPilot,
      hasStripeKey: hasStripe,
      hasDailyKey: hasDaily,
      dailyDomain: process.env.DAILY_DOMAIN || 'talke',
      adminEmail: 'jonathan.oliveira.da@gmail.com',
      environment: process.env.NODE_ENV || 'development',
      databaseProvider: 'Firebase Firestore',
    });
  }

  public static health(_req: Request, res: Response) {
    res.json({
      status: 'ok',
      architecture: 'Clean Architecture & DDD',
      timestamp: new Date().toISOString(),
    });
  }
}
