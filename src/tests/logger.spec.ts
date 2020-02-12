import Logger from '../logger';
import ILogger from '../interfaces/logger';

describe('Logger Class', () => {
	let logger: ILogger;

	beforeEach(() => {
		jest.spyOn(Date, 'now').mockImplementation(() => 0);
		logger = new Logger();
	})

	test('method set should set and a log', () => {
		logger.set('my message');
		expect(logger.get()).toEqual(['[01/01/701970 01:00:00] my message']);
	})
})