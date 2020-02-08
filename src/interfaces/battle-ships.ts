import IMessage from './message';
import IPlayer from './player';

export default interface IBattleShips {
	handle(data: IMessage): IMessage[];
	checkIn(): IMessage[];
	getPlayers(): IPlayer[][];
}