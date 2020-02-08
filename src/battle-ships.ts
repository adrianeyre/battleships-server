import IBattleShips from './interfaces/battle-ships';
import IBattleShipsProps from './interfaces/battle-ships-props';
import IMessage from './interfaces/message';
import MessageActionEnum from './enums/message-action-enum';
import IPlayer from './interfaces/player';
import Player from './player';
import ILogger from './interfaces/logger';

export default class BattleShips implements IBattleShips {
	private players: IPlayer[][]
	private logger: ILogger;

	private readonly DEFAULT_BOTH_PLAYERS_LOGGED_IN_MESSAGE = 'Both players have logged in, please set your boards'
	private readonly DEFAULT_BOTH_PLAYERS_SETUP_COMPLETE_IN_MESSAGE = 'Both players have now setup their boards'
	private readonly DEFAULT_GAME_OVER_MESSAGE = 'Game Ove! place your ships to play again';

	constructor(props: IBattleShipsProps) {
		this.players = [];
		this.logger = props.logger;

		this.logger.set('This is a test')
		this.logger.set('Another test')
	}

	public checkIn = (): IMessage[] => {
		const messages: IMessage[] = [];
		const disconnectedGroups: IPlayer[][] = [];

		this.players.forEach((playerGroup: IPlayer[]) => {
			playerGroup.forEach((player: IPlayer) => {
				if (!player.checked) {
					this.logOutGroup(playerGroup, messages);
					disconnectedGroups.push(playerGroup);
				}

				player.resetCheck();
				messages.push(this.message(MessageActionEnum.CHECK, player, ''));
			})
		})

		disconnectedGroups.forEach((group: IPlayer[]) => {
			const index = this.players.indexOf(group);
			if (index < 0) {
				this.logger.set('Could not find group to remove');
				return;
			}

			this.players.splice(index, 1);
		})

		return messages
	}

	public handle = (data: IMessage): IMessage[] => {
		switch (data.action) {
			case MessageActionEnum.MESSAGE:
				return this.sendMessage(data);
			case MessageActionEnum.LOGIN:
				return this.login(data);
			case MessageActionEnum.SETUP_COMPLETE:
				return this.setupComplete(data);
			case MessageActionEnum.FIRE:
				return this.handleInput(MessageActionEnum.FIRE, data);
			case MessageActionEnum.HIT:
				return this.handleInput(MessageActionEnum.HIT, data);
			case MessageActionEnum.MISS:
				return this.handleInput(MessageActionEnum.MISS, data);
			case MessageActionEnum.DESTROYED:
				return this.handleDestroyed(data);
			case MessageActionEnum.RESPOND:
				this.respond(data); break;
		}

		return [];
	}

	public getPlayers = (): IPlayer[][] => this.players;

	private logOutGroup = (playerGroup: IPlayer[], messages: IMessage[]): void => {
		playerGroup.forEach((player: IPlayer) => messages.push(this.message(MessageActionEnum.LOGOUT, player, 'Players have disconnected!')));
	}

	private login = (data: IMessage): IMessage[] => {
		const newPlayer = new Player(data);
		let lastPlayers = this.players[this.players.length - 1];

		if (!lastPlayers || lastPlayers.length > 1) {
			this.players.push([]);
			lastPlayers = this.players[this.players.length - 1];
		}

		lastPlayers.push(newPlayer);

		const messages: IMessage[] = [...lastPlayers].map((player: IPlayer) => this.message(MessageActionEnum.MESSAGE, player, data.message));

		if (lastPlayers.length > 1) {
			[...lastPlayers].forEach((player: IPlayer) => messages.push(this.message(MessageActionEnum.MESSAGE, player, this.DEFAULT_BOTH_PLAYERS_LOGGED_IN_MESSAGE)));
		}

		return messages;
	}

	private respond = (data: IMessage): void => {
		const playerGroup = this.getPlayerGroupById(data.id);
		if (!playerGroup) return;
		const player = this.getPlayerFromGroupById(data.id, playerGroup);

		if (!player) {
			this.logger.set('Method: respond, Player not found to respond');
			return;
		}

		player.respond();
	}

	private setupComplete = (data: IMessage): IMessage[] => {
		const playerGroup = this.getPlayerGroupById(data.id);
		if (!playerGroup) {
			this.logger.set(`Method: setupComplete, No player for id: ${ data.id } was found`);
			return [];
		}

		const player = this.getPlayerFromGroupById(data.id, playerGroup);

		if (!player) {
			this.logger.set('Method: setupComplete, Player not found when setup is complete');
			return [];
		}

		player.hasCompletedSetup();

		const messages: IMessage[] = [...playerGroup].map((player: IPlayer) => this.message(MessageActionEnum.MESSAGE, player, data.message));
		const setupCompleteCount = playerGroup.reduce((accumulator: number, item: IPlayer) => accumulator + (item.setupComplete ? 1 : 0), 0);

		if (setupCompleteCount > 1) {
			[...playerGroup].forEach((player: IPlayer) => messages.push(this.message(MessageActionEnum.MESSAGE, player, this.DEFAULT_BOTH_PLAYERS_SETUP_COMPLETE_IN_MESSAGE)));
			this.setCurrentPlayer(playerGroup, 0);
			[...playerGroup].forEach((player: IPlayer) => messages.push(this.message(MessageActionEnum.MESSAGE, player, `${ playerGroup[0].name } please select a block`)));
		}

		return messages;
	}

	private handleInput = (action: MessageActionEnum, data: IMessage): IMessage[] => {
		const playerGroup = this.getPlayerGroupById(data.id);
		if (!playerGroup) {
			this.logger.set(`Method: handleInput, No player for id: ${ data.id } was found`);
			return [];
		}

		const player = this.getPlayerFromGroupById(data.id, playerGroup);

		if (!player) {
			this.logger.set('Method: handleInput, Player not found when setup is firing');
			return [];
		}
		if (action === MessageActionEnum.FIRE && !player.currentUser) return [];

		const currentPlayerId = this.getCurrentPlayerId(playerGroup);
		if (action !== MessageActionEnum.FIRE) this.swapPlayers(playerGroup);
		return [...playerGroup].map((player: IPlayer) => this.message(action, player, data.message, data.x, data.y, currentPlayerId));
	}

	private handleDestroyed = (data: IMessage): IMessage[] => {
		const playerGroup = this.getPlayerGroupById(data.id);
		if (!playerGroup) {
			this.logger.set(`Method: handleDestroyed, No player for id: ${ data.id } was found`);
			return [];
		}
		const player = this.getPlayerFromGroupById(data.id, playerGroup);

		if (!player) {
			this.logger.set('Method: handleDestroyed, Player not found when ship destroyed');
			return [];
		}

		[...playerGroup].forEach((player: IPlayer) => player.reset());

		return [...playerGroup].map((player: IPlayer) => this.message(MessageActionEnum.GAME_OVER, player, this.DEFAULT_GAME_OVER_MESSAGE));
	}

	private swapPlayers = (players: IPlayer[]): void => {
		const currentPlayer = players.find((player: IPlayer) => player.currentUser);
		const otherPlayer = players.find((player: IPlayer) => !player.currentUser);

		if (!currentPlayer || ! otherPlayer) {
			this.logger.set('Method: swapPlayers, currentPlayer or otherPlayer not found');
			return;
		}

		currentPlayer.deseclectCurrectUser();
		otherPlayer.setCurrentUser();
	}

	private setCurrentPlayer = (players: IPlayer[], index: number): void => {
		players[index].setCurrentUser();
		players[index === 0 ? 1 : 0].deseclectCurrectUser();
	}

	private getCurrentPlayerId = (players: IPlayer[]): string => {
		let id = '';

		players.forEach((player: IPlayer) => {
			if (player.currentUser) return id = player.id;
		});

		return id;
	}

	private sendMessage = (data: IMessage): IMessage[] => {
		const playerGroup = this.getPlayerGroupById(data.id);

		if (!playerGroup) {
			this.logger.set(`Method: sendMessage, No player for id: ${ data.id } was found`);
			return [];
		}

		return [...playerGroup].map((player: IPlayer) => this.message(MessageActionEnum.MESSAGE, player, data.message));
	}

	private getPlayerGroupById = (id: string): IPlayer[] | null => {
		let selectedPlayerGroup = null;

		this.players.forEach((playerGroup: IPlayer[]) => {
			if (this.getPlayerFromGroupById(id, playerGroup)) return selectedPlayerGroup = playerGroup;
		});

		return selectedPlayerGroup;
	}

	private getPlayerFromGroupById = (id: string, group: IPlayer[]) => group.find((player: IPlayer) => player.id === id);

	private message = (action: MessageActionEnum, player: IPlayer, message: string, x?: number, y?: number, currentUser?: string): IMessage => ({
		dateTime: Date.now(),
		action,
		id: player.id,
		socketId: player.socketId,
		name: player.name,
		message,
		currentUser,
		x,
		y,
	})
}