import { Injectable } from '@nestjs/common';

import { PrismaService } from '@@db';
import { ScrapeSource, ScrapeStatus } from '@@prisma';

interface RunOptions<T> {
  source: ScrapeSource;
  target: string;
  task: () => Promise<{ result: T; diffSummary?: Record<string, unknown> }>;
}

@Injectable()
export class ScrapeJobRecorder {
  constructor(private readonly prismaService: PrismaService) {}

  async run<T>({ source, target, task }: RunOptions<T>): Promise<T> {
    const job = await this.prismaService.scrapeJob.create({
      data: { source, target, status: ScrapeStatus.RUNNING },
    });

    try {
      const { result, diffSummary } = await task();
      await this.prismaService.scrapeJob.update({
        where: { id: job.id },
        data: {
          status: ScrapeStatus.SUCCESS,
          finishedAt: new Date(),
          diffSummary: diffSummary ?? undefined,
        },
      });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.prismaService.scrapeJob.update({
        where: { id: job.id },
        data: {
          status: ScrapeStatus.FAILED,
          finishedAt: new Date(),
          error: message.slice(0, 1000),
        },
      });
      throw error;
    }
  }

  async skip(source: ScrapeSource, target: string, reason: string): Promise<void> {
    await this.prismaService.scrapeJob.create({
      data: {
        source,
        target,
        status: ScrapeStatus.SKIPPED,
        finishedAt: new Date(),
        error: reason.slice(0, 1000),
      },
    });
  }
}
