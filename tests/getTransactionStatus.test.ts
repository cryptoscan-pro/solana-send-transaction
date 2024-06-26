import { describe, test, expect } from 'bun:test';
import { getTransactionStatus } from '../lib/getTransactionStatus';

describe('test get transaction status', () => {
	test('should get confirmed status', async () => {
		const status = await getTransactionStatus(
			'2SWkW4bBpvgkaHqoqcdqC5pqJ5xyY9YjLXRp6gnvuwN7bhSXR4quwx1PuxMmWiPV2CRsCKNJFxNjmesyWbGeLFiP',
		);
		expect(status).toBe('confirmed')
	})
})
