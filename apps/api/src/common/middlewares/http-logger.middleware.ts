import { Injectable, Logger, NestMiddleware } from '@nestjs/common';

import { NextFunction, Request, Response } from 'express';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();

    res.on('finish', () => {
      const userIpV4 = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
      const userIpV6 = req.ips.length > 0 ? req.ips[0] : (req.ip ?? 'unknown');
      const contentLength = res.getHeader('content-length') || 0;
      const referrer = req.header('Referer') || req.header('Referrer');
      const formattedReferrer = referrer ? ` "${referrer}" ` : ' ';
      const userAgent = req.header('user-agent');
      const responseTime = Date.now() - startTime;

      const message = `[${userIpV4} | ${userIpV6}] - "${req.method} ${req.originalUrl} HTTP/${req.httpVersion}" ${res.statusCode} - ${contentLength}${formattedReferrer}"${userAgent}" \x1b[33m+${responseTime}ms`;

      if (res.statusCode >= 400) {
        this.logger.error(message);

        return;
      }

      this.logger.log(message);
    });

    next();
  }
}
