export default interface IPlayer {
	id: string;
	name: string;
	socketId: string;
	setupComplete: boolean;
	currentUser: boolean;
	checked: boolean;
	colour: string;
	reset(): void;
	hasCompletedSetup(): boolean;
	setCurrentUser(): boolean;
	deseclectCurrectUser(): boolean;
	resetCheck(): boolean;
	respond(): boolean;
}