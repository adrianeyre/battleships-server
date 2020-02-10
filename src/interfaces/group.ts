import IPlayer from './player';

export default interface IGroup {
	group: IPlayer[] | null;
	player: IPlayer | undefined;
}