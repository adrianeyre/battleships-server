import BattleShips from '../battle-ships';
import IBattleShips from '../interfaces/battle-ships';
import IBattleShipsProps from '../interfaces/battle-ships-props'
import Logger from '../logger';
import IMessage from '../interfaces/message';
import MessageActionEnum from '../enums/message-action-enum';

describe('Logger Class', () => {
	let battleShips: IBattleShips;
	let props: IBattleShipsProps

	beforeEach(() => {
		props = {
			logger: new Logger()
		}

		battleShips = new BattleShips(props);
	})

	test('method checkIn should log in a new user', () => {
		const data: IMessage = {
			action: MessageActionEnum.LOGIN,
			id: 'player-id',
			socketId: 'socket-id',
			name: 'player-name',
			message: 'my message',
			colour: 'black'
		}

		battleShips.handle(data);
		const result = battleShips.checkIn();

		expect(result[0]).toHaveProperty('id', 'player-id');
		expect(result[0]).toHaveProperty('message', '');
		expect(result[0]).toHaveProperty('name', 'player-name');
		expect(result[0]).toHaveProperty('action', MessageActionEnum.CHECK);
	})

	test('method getPlayers should give you logged in players', () => {
		const data: IMessage = {
			action: MessageActionEnum.LOGIN,
			id: 'player-id',
			socketId: 'socket-id',
			name: 'player-name',
			message: 'my message',
			colour: 'black'
		}

		battleShips.handle(data);
		const result = battleShips.getPlayers();
		const player = result[0][0];

		expect(player).toHaveProperty('id', 'player-id');
		expect(player).toHaveProperty('checked', true);
		expect(player).toHaveProperty('currentUser', false);
		expect(player).toHaveProperty('name', 'player-name');
	})
})