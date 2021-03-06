import MessageActionEnum from '../enums/message-action-enum';

export default interface IMessage {
	dateTime?: number;
	action: MessageActionEnum
	id: string;
	socketId: string;
	name: string;
	message: string;
	colour: string;
	currentUser?: string;
	x?: number;
	y?: number;
	ship?: string;
}