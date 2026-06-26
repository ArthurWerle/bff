import { TransactionService } from './TransactionService';
import { Transaction } from '../types/transactions';

// Helper to build a minimal Transaction object for tests
function makeTx(overrides: Partial<Transaction>): Transaction {
  return {
    id: 1,
    category_id: 1,
    amount: 0,
    type: 'expense',
    description: '',
    date: '2026-01-01',
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

// ---- getTotalValueGroupedByType ----

describe('getTotalValueGroupedByType', () => {
  const service = new TransactionService();

  it('sums income and expense correctly', () => {
    const transactions: Transaction[] = [
      makeTx({ type: 'income', amount: 100 }),
      makeTx({ type: 'income', amount: 50 }),
      makeTx({ type: 'expense', amount: 200 }),
      makeTx({ type: 'expense', amount: 75 }),
    ];

    const result = service.getTotalValueGroupedByType(transactions);

    expect(result.income).toBe(150);
    expect(result.expense).toBe(275);
  });

  it('returns zeros for empty list', () => {
    const result = service.getTotalValueGroupedByType([]);
    expect(result.income).toBe(0);
    expect(result.expense).toBe(0);
  });

  it('handles income-only list', () => {
    const transactions: Transaction[] = [
      makeTx({ type: 'income', amount: 300 }),
    ];
    const result = service.getTotalValueGroupedByType(transactions);
    expect(result.income).toBe(300);
    expect(result.expense).toBe(0);
  });

  it('handles expense-only list', () => {
    const transactions: Transaction[] = [
      makeTx({ type: 'expense', amount: 400 }),
    ];
    const result = service.getTotalValueGroupedByType(transactions);
    expect(result.income).toBe(0);
    expect(result.expense).toBe(400);
  });
});

// ---- overviewByMonth ----

describe('overviewByMonth', () => {
  it('returns null percentageVariation when last month has no income or expense', async () => {
    const service = new TransactionService();

    // Current month: income=100, expense=200
    // Last month:    income=0, expense=0 → division by zero → both must be null
    jest
      .spyOn(service, 'getTransactionsByDateRange')
      .mockResolvedValueOnce({ count: 1, transactions: [makeTx({ type: 'income', amount: 100 }), makeTx({ type: 'expense', amount: 200 })] })
      .mockResolvedValueOnce({ count: 0, transactions: [] });

    const result = await service.overviewByMonth(6, 2026);

    expect(result.income.percentageVariation).toBeNull();
    expect(result.expense.percentageVariation).toBeNull();
  });

  it('calculates correct percentageVariation when both months have data', async () => {
    const service = new TransactionService();

    // Current month: income=150, expense=300
    // Last month:    income=100, expense=200
    // income variation: (150-100)/100 * 100 = +50%
    // expense variation: (300-200)/200 * 100 = +50%
    jest
      .spyOn(service, 'getTransactionsByDateRange')
      .mockResolvedValueOnce({
        count: 1,
        transactions: [
          makeTx({ type: 'income', amount: 150 }),
          makeTx({ type: 'expense', amount: 300 }),
        ],
      })
      .mockResolvedValueOnce({
        count: 1,
        transactions: [
          makeTx({ type: 'income', amount: 100 }),
          makeTx({ type: 'expense', amount: 200 }),
        ],
      });

    const result = await service.overviewByMonth(6, 2026);

    expect(result.income.currentMonth).toBe(150);
    expect(result.income.lastMonth).toBe(100);
    expect(result.income.percentageVariation).toBeCloseTo(50, 5);

    expect(result.expense.currentMonth).toBe(300);
    expect(result.expense.lastMonth).toBe(200);
    expect(result.expense.percentageVariation).toBeCloseTo(50, 5);
  });

  it('returns null only for the zero-denominator metric, not both', async () => {
    const service = new TransactionService();

    // Current month: income=200, expense=100
    // Last month:    income=100, expense=0
    // income variation: (200-100)/100 * 100 = +100%
    // expense variation: null (last month expense was 0)
    jest
      .spyOn(service, 'getTransactionsByDateRange')
      .mockResolvedValueOnce({
        count: 1,
        transactions: [
          makeTx({ type: 'income', amount: 200 }),
          makeTx({ type: 'expense', amount: 100 }),
        ],
      })
      .mockResolvedValueOnce({
        count: 1,
        transactions: [makeTx({ type: 'income', amount: 100 })],
      });

    const result = await service.overviewByMonth(6, 2026);

    expect(result.income.percentageVariation).toBeCloseTo(100, 5);
    expect(result.expense.percentageVariation).toBeNull();
  });
});
