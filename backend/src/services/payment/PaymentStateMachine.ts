import { PaymentStatus } from '@models/Payment';
import { AppError } from '@/errors/appError';

/**
 * Formal Finite State Machine governing valid payment lifecycle transitions.
 * Prevents illegal state reversals such as:
 * - FAILED → SUCCESS without authentic cryptographic gateway proof
 * - REFUNDED → SUCCESS
 * - CANCELLED → REFUNDED
 * - SUCCESS → FAILED
 */
export class PaymentStateMachine {
  private static readonly VALID_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
    CREATED: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'],
    PENDING: ['SUCCESS', 'FAILED', 'CANCELLED'],
    SUCCESS: ['PARTIALLY_REFUNDED', 'REFUNDED'],
    PARTIALLY_REFUNDED: ['PARTIALLY_REFUNDED', 'REFUNDED'],
    REFUNDED: [], // Terminal financial state
    FAILED: ['SUCCESS'], // Permitted strictly with cryptographic gateway verification if customer retried
    CANCELLED: [] // Terminal cancellation state
  };

  /**
   * Determines whether transitioning from currentStatus to targetStatus is permitted.
   */
  public static canTransition(current: PaymentStatus, target: PaymentStatus): boolean {
    if (current === target) return true; // Idempotent no-op
    const allowed = this.VALID_TRANSITIONS[current] || [];
    return allowed.includes(target);
  }

  /**
   * Validates state transition and throws a 400 AppError if invalid.
   */
  public static validateTransition(current: PaymentStatus, target: PaymentStatus, context?: string): void {
    if (!this.canTransition(current, target)) {
      const msg = `Invalid payment status transition from '${current}' to '${target}'${
        context ? ` in ${context}` : ''
      }. This action violates payment lifecycle state rules.`;
      throw new AppError(msg, 400);
    }
  }
}
