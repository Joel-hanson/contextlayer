import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface LogEntry {
    bridgeId: string;
    level: string;
    message: string;
    metadata?: Prisma.InputJsonValue;
}

export class LogQueue {
    private queue: LogEntry[] = [];
    private timer: NodeJS.Timeout | null = null;
    private readonly batchSize: number;
    private readonly flushInterval: number;

    constructor(batchSize = 10, flushInterval = 5000) {
        this.batchSize = batchSize;
        this.flushInterval = flushInterval;
    }

    public async add(entry: LogEntry): Promise<void> {
        this.queue.push(entry);

        if (this.queue.length >= this.batchSize) {
            await this.flush();
        } else if (!this.timer) {
            this.timer = setTimeout(() => this.flush(), this.flushInterval);
        }
    }

    public async flush(): Promise<void> {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }

        if (this.queue.length === 0) {
            return;
        }

        const logs = [...this.queue];
        this.queue = [];

        try {
            await prisma.bridgeLog.createMany({
                data: logs.map(log => ({
                    bridgeId: log.bridgeId,
                    level: log.level,
                    message: log.message,
                    metadata: log.metadata
                } satisfies Prisma.BridgeLogCreateManyInput))
            });
        } catch (error) {
            console.error('Error flushing logs:', error);
            // Re-add the logs to the queue on error
            this.queue = [...logs, ...this.queue];
        }
    }

    public clear(): void {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        this.queue = [];
    }
}
