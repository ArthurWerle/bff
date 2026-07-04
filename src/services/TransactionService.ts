import { Service } from './Service';

// Thin HTTP client for the Go transaction service. All aggregation and
// business logic lives in the Go service; the BFF only proxies.
export class TransactionService extends Service {
  constructor() {
    super(
      process.env.TRANSACTION_SERVICE_URL ||
        'http://transaction-service-v2:8080/api/v2'
    );
  }
}
