import axios from 'axios';
import { Service } from './Service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Service', () => {
  it('prefixes every request with the base URL and forwards params', async () => {
    mockedAxios.get.mockResolvedValue({ status: 200, data: {} });

    const service = new Service('http://upstream:8080/api/v2');
    await service.get('/transactions/reports/month-overview', {
      month: 7,
      year: 2026,
    });

    expect(mockedAxios.get).toHaveBeenCalledWith(
      'http://upstream:8080/api/v2/transactions/reports/month-overview',
      { params: { month: 7, year: 2026 } }
    );
  });
});
