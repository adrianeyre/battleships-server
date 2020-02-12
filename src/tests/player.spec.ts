import Player from '../player';
import IPlayerProps from '../interfaces/player-props';
import IPlayer from '../interfaces/player';

describe('Player Class', () => {
	let playerProps: IPlayerProps;
	let player: IPlayer

	beforeEach(() => {
		playerProps = {
			id: 'player-id',
			name: 'player-name',
			socketId: 'socket-id',
		}
	
		player = new Player(playerProps);
	})

	test('constructor', () => {
		expect(player).toHaveProperty('id', 'player-id');
		expect(player).toHaveProperty('name', 'player-name');
		expect(player).toHaveProperty('socketId', 'socket-id');
		expect(player).toHaveProperty('setupComplete', false);
		expect(player).toHaveProperty('currentUser', false);
		expect(player).toHaveProperty('checked', true);
	})

	test('method reset should reset values', () => {
		expect(player).toHaveProperty('setupComplete', false);
		expect(player).toHaveProperty('currentUser', false);

		player.setupComplete = true;
		player.currentUser = true;

		expect(player).toHaveProperty('setupComplete', true);
		expect(player).toHaveProperty('currentUser', true);

		player.reset();

		expect(player).toHaveProperty('setupComplete', false);
		expect(player).toHaveProperty('currentUser', false);
	})

	test('method resetCheck should reset checked boolean', () => {
		expect(player.resetCheck()).toEqual(false);
		expect(player).toHaveProperty('checked', false);
	})

	test('method respond should reset checked boolean', () => {
		player.checked = false;
		expect(player.respond()).toEqual(true);
		expect(player).toHaveProperty('checked', true);
	})

	test('method hasCompletedSetup should set setupComplete boolean', () => {
		expect(player.hasCompletedSetup()).toEqual(true);
		expect(player).toHaveProperty('setupComplete', true);
	})

	test('method setCurrentUser should set currentUser boolean', () => {
		expect(player.setCurrentUser()).toEqual(true);
		expect(player).toHaveProperty('currentUser', true);
	})

	test('method deseclectCurrectUser should unset currentUser boolean', () => {
		player.currentUser = true;
		expect(player.deseclectCurrectUser()).toEqual(false);
		expect(player).toHaveProperty('currentUser', false);
	})
})
