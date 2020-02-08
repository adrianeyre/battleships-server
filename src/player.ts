import IPlayer from './interfaces/player';
import IPlayerProps from './interfaces/player-props'

export default class Player implements IPlayer {
	public id: string;
	public name: string;
	public socketId: string;
	public setupComplete: boolean;
	public currentUser: boolean;
	public checked: boolean;
	public colour: string;

	private colours: string[] = [
		'#9c750b', '#9c390b', '#9c0d0b', '#239c0b', '#0b9c4c', '#0b9c8b', '#0b849c',
		'#0b589c', '#0b349c', '#2d0b9c', '#6c0b9c', '#9c0b9a', '#9c0b60', '#9c0b39',
		'#9c0b0b', '#691010', '#693410', '#695a10', '#5c6910', '#456910', '#0c5910',
		'#0c5946', '#0c4a59', '#0c1f59', '#270c59', '#460c59', '#590c46', '#590c19',
	]

	constructor(props: IPlayerProps) {
		this.id = props.id;
		this.name = props.name;
		this.socketId = props.socketId;
		this.setupComplete = false;
		this.currentUser = false;
		this.checked = true;
		this.colour = this.colours[Math.floor(Math.random() * (this.colours.length - 1))];
	}

	public reset = (): void => {
		this.setupComplete = false;
		this.currentUser = false;
	}

	public resetCheck = (): boolean => this.checked = false;
	public respond = (): boolean => this.checked = true;
	public hasCompletedSetup = (): boolean => this.setupComplete = true;
	public setCurrentUser = (): boolean => this.currentUser = true;
	public deseclectCurrectUser = (): boolean => this.currentUser = false;
}