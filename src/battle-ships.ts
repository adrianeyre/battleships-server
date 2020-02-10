import { get } from 'lodash';

import IBattleShips from './interfaces/battle-ships';
import IBattleShipsProps from './interfaces/battle-ships-props';
import IMessage from './interfaces/message';
import MessageActionEnum from './enums/message-action-enum';
import IPlayer from './interfaces/player';
import Player from './player';
import ILogger from './interfaces/logger';
import IGroup from './interfaces/group';

export default class BattleShips implements IBattleShips {
	private players: IPlayer[][]
	private logger: ILogger;

	private readonly DEFAULT_BOTH_PLAYERS_LOGGED_IN_MESSAGE = 'Both players have logged in, please set your boards'
	private readonly DEFAULT_BOTH_PLAYERS_SETUP_COMPLETE_IN_MESSAGE = 'Both players have now setup their boards'
	private readonly DEFAULT_PLAYERS_DISCONNECTED_MESSAGE = 'Players have disconnected!';
	private readonly DEFAULT_BASIC_GAME_OVER_MESSAGE = 'Game Over!';
	private readonly DEFAULT_GAME_OVER_MESSAGE = (name: string) => `Game Over! ${ name } is the winner!`;
	private readonly DEFAULT_START_MESSAGE = (name: string) => `${ name } please select a block`;
	private readonly DEFAULT_TEXT_COLOUR = '#000000';

	constructor(props: IBattleShipsProps) {
		this.players = [];
		this.logger = props.logger;

		this.logger.set('Application started');
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
				messages.push(this.message(MessageActionEnum.CHECK, player, player, '', ''));
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
			case MessageActionEnum.SUNK:
				return this.sendMessage(data);
			case MessageActionEnum.RESPOND:
				this.respond(data); break;
		}

		return [];
	}

	public getPlayers = (): IPlayer[][] => this.players;

	private logOutGroup = (playerGroup: IPlayer[], messages: IMessage[]): void => {
		playerGroup.forEach((player: IPlayer) => messages.push(this.message(MessageActionEnum.LOGOUT, player, player, this.DEFAULT_PLAYERS_DISCONNECTED_MESSAGE, this.DEFAULT_TEXT_COLOUR)));
	}

	private login = (data: IMessage): IMessage[] => {
		const newPlayer = new Player(data);
		let lastPlayers = this.players[this.players.length - 1];

		if (!lastPlayers || lastPlayers.length > 1) {
			this.players.push([]);
			lastPlayers = this.players[this.players.length - 1];
		}

		lastPlayers.push(newPlayer);

		const messages: IMessage[] = [...lastPlayers].map((player: IPlayer) => this.message(MessageActionEnum.MESSAGE, newPlayer, player, data.message));

		if (lastPlayers.length > 1) {
			[...lastPlayers].forEach((player: IPlayer) => messages.push(this.message(MessageActionEnum.MESSAGE, player, player, this.DEFAULT_BOTH_PLAYERS_LOGGED_IN_MESSAGE, this.DEFAULT_TEXT_COLOUR)));
		}

		return messages;
	}

	private respond = (data: IMessage): void => {
		const groupData = this.getGroupAndPlayer(data);
		if (!groupData || !groupData.group || !groupData.player) return;

		groupData.player.respond();
	}

	private setupComplete = (data: IMessage): IMessage[] => {
		const groupData = this.getGroupAndPlayer(data);
		if (!groupData || !groupData.group || !groupData.player) return [];

		groupData.player.hasCompletedSetup();

		const messages: IMessage[] = [...groupData.group].map((player: IPlayer) => this.message(MessageActionEnum.MESSAGE, groupData.player, player, data.message, player.colour));
		const setupCompleteCount = groupData.group.reduce((accumulator: number, item: IPlayer) => accumulator + (item.setupComplete ? 1 : 0), 0);

		if (setupCompleteCount > 1) {
			[...groupData.group].forEach((player: IPlayer) => messages.push(this.message(MessageActionEnum.MESSAGE, player, player, this.DEFAULT_BOTH_PLAYERS_SETUP_COMPLETE_IN_MESSAGE, this.DEFAULT_TEXT_COLOUR)));
			this.setCurrentPlayer(groupData.group, 0);
			[...groupData.group].forEach((player: IPlayer) => messages.push(this.message(MessageActionEnum.MESSAGE, player, player, this.DEFAULT_START_MESSAGE(get(groupData, 'group[0].name')), this.DEFAULT_TEXT_COLOUR)));
		}

		return messages;
	}

	private getGroupAndPlayer = (data: IMessage): IGroup => {
		const result = { player: undefined, group: null }
		const group = this.getPlayerGroupById(data.id);
		if (!group) {
			this.logger.set(`Method: getGroupAndPlayer, No group for id: ${ data.id } was found`);
			return result;
		}

		const player = this.getPlayerFromGroupById(data.id, group);
		if (!player) {
			this.logger.set(`Method: getGroupAndPlayer, Player not found for id: ${ data.id } was found`);
			return result;
		}

		return { group, player };
	}

	private handleInput = (action: MessageActionEnum, data: IMessage): IMessage[] => {
		const groupData = this.getGroupAndPlayer(data);
		if (!groupData || !groupData.group || !groupData.player) return [];
		if (action === MessageActionEnum.FIRE && !groupData.player.currentUser) return [];

		const currentPlayerId = this.getCurrentPlayerId(groupData.group);
		if (action !== MessageActionEnum.FIRE) this.swapPlayers(groupData.group);
		return [...groupData.group].map((player: IPlayer) => this.message(action, groupData.player, player, data.message, get(groupData, 'player.colour'), data.x, data.y, currentPlayerId));
	}

	private handleDestroyed = (data: IMessage): IMessage[] => {
		const groupData = this.getGroupAndPlayer(data);
		if (!groupData || !groupData.group || !groupData.player) return [];

		const winner = [...groupData.group].find((player: IPlayer) => player.id !== data.id);
		const message = winner && winner.name ? this.DEFAULT_GAME_OVER_MESSAGE(winner.name) : this.DEFAULT_BASIC_GAME_OVER_MESSAGE;

		[...groupData.group].forEach((player: IPlayer) => player.reset());
		return [...groupData.group].map((player: IPlayer) => this.message(MessageActionEnum.GAME_OVER, player, player, message, this.DEFAULT_TEXT_COLOUR));
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
		const groupData = this.getGroupAndPlayer(data);
		if (!groupData || !groupData.group || !groupData.player) return [];

		return [...groupData.group].map((player: IPlayer) => this.message(data.action, groupData.player, player, data.message));
	}

	private getPlayerGroupById = (id: string): IPlayer[] | null => {
		let selectedPlayerGroup = null;

		this.players.forEach((playerGroup: IPlayer[]) => {
			if (this.getPlayerFromGroupById(id, playerGroup)) return selectedPlayerGroup = playerGroup;
		});

		return selectedPlayerGroup;
	}

	private getPlayerFromGroupById = (id: string, group: IPlayer[]) => group.find((player: IPlayer) => player.id === id) || null;

	private message = (action: MessageActionEnum, fromPlayer: IPlayer | undefined, toPlayer: IPlayer, message: string, colour?: string, x?: number, y?: number, currentUser?: string): IMessage => {
		if (!fromPlayer) throw Error('No from player found!');
		
		return {
			dateTime: Date.now(),
			action,
			id: fromPlayer.id,
			socketId: toPlayer.socketId,
			name: fromPlayer.name,
			message,
			colour: colour || fromPlayer.colour,
			currentUser,
			x,
			y,
		}
	}
}