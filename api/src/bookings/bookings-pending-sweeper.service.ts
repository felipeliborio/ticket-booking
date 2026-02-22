import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { BookingsService } from "src/bookings/bookings.service";

const DEFAULT_INTERVAL_MS = 30_000;

@Injectable()
export class BookingsPendingSweeperService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(BookingsPendingSweeperService.name);
  private timer: NodeJS.Timeout | undefined;
  private running = false;

  constructor(private readonly bookingsService: BookingsService) {}

  onModuleInit(): void {
    const intervalMs = this.getIntervalMs();

    this.timer = setInterval(() => {
      void this.sweep();
    }, intervalMs);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private getIntervalMs(): number {
    const configured = Number.parseInt(
      process.env.BOOKINGS_PENDING_SWEEPER_INTERVAL_MS ?? "",
      10,
    );

    if (Number.isNaN(configured) || configured <= 0) {
      return DEFAULT_INTERVAL_MS;
    }

    return configured;
  }

  private async sweep(): Promise<void> {
    if (this.running) {
      return;
    }

    this.logger.log("Failing expired bookings");

    this.running = true;

    try {
      const updatedCount =
        await this.bookingsService.failExpiredPendingBookings();

      if (updatedCount > 0) {
        this.logger.log(`Marked ${updatedCount} expired bookings as failure.`);
      }
    } catch (error) {
      this.logger.error(
        "Failed to sweep pending bookings.",
        error instanceof Error ? error.stack : undefined,
      );
    } finally {
      this.running = false;
    }
  }
}
