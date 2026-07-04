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

  it('excludes prepayment rows (consumption basis)', () => {
    const transactions: Transaction[] = [
      makeTx({ type: 'expense', amount: 100 }),
      makeTx({ type: 'expense', amount: 2500, prepaid_from_id: 42 }),
    ];
    const result = service.getTotalValueGroupedByType(transactions);
    expect(result.expense).toBe(100);
  });
});

// ---- getIncomeAndExpenseComparisonHistory ----

describe('getIncomeAndExpenseComparisonHistory', () => {
  it('emits a chronological data point for every month, including empty ones', async () => {
    const service = new TransactionService();

    // Every month in range returns no transactions.
    jest
      .spyOn(service, 'getTransactionsByDateRange')
      .mockResolvedValue({ count: 0, transactions: [] });

    const result = await service.getIncomeAndExpenseComparisonHistory();

    const start = new Date(2025, 0, 1);
    const today = new Date();
    const expectedMonths =
      (today.getFullYear() - start.getFullYear()) * 12 +
      today.getMonth() -
      start.getMonth() +
      1;

    expect(result).toHaveLength(expectedMonths);
    expect(result[0].month).toMatch(/25$/); // starts at Jan 2025, oldest first
    result.forEach((point) => {
      expect(point.income).toBe(0);
      expect(point.expense).toBe(0);
      expect(point.balance).toBe(0);
    });
  });

  it('reports net cash flow (balance) per month', async () => {
    const service = new TransactionService();

    jest.spyOn(service, 'getTransactionsByDateRange').mockResolvedValue({
      count: 2,
      transactions: [
        makeTx({ type: 'income', amount: 5000 }),
        makeTx({ type: 'expense', amount: 3200 }),
      ],
    });

    const result = await service.getIncomeAndExpenseComparisonHistory();

    expect(result[0].balance).toBe(1800);
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

// ---- getMonthlyExpensesByCategory ----

describe('getMonthlyExpensesByCategory', () => {
  it('labels soft-deleted categories instead of hiding their spend', async () => {
    const service = new TransactionService();

    jest.spyOn(service, 'getTransactionsByDateRange').mockResolvedValue({
      count: 2,
      transactions: [
        makeTx({ type: 'expense', amount: 100, category_id: 1 }),
        makeTx({ type: 'expense', amount: 40, category_id: 2 }),
      ],
    });
    jest.spyOn(service, 'getCategories').mockResolvedValue({
      count: 2,
      categories: [
        {
          id: 1,
          name: 'Food',
          description: '',
          color: '',
          created_at: '',
          updated_at: '',
          deleted_at: null,
        },
        {
          id: 2,
          name: 'Old Hobby',
          description: '',
          color: '',
          created_at: '',
          updated_at: '',
          deleted_at: '2026-06-01T00:00:00Z',
        },
      ],
    });

    const result = await service.getMonthlyExpensesByCategory(7, 2026);

    expect(result).toEqual({
      Food: 100,
      'Old Hobby (deleted)': 40,
    });
  });
});
