import * as moment from 'moment';

import ILogger from './interfaces/logger';

export default class Logger implements ILogger {
	private logs: string[];
	private readonly maxSize: number = 100;

	constructor() {
		this.logs = [];
	}

	public set = (message: string) => {
		this.logs.unshift(`[${ moment().format("DD/MM/YYY HH:mm:ss") }] ${ message }`);

		if (this.logs.length > this.maxSize) this.logs.pop();
	}

	public get = (): string[] => this.logs;
}