import { createServer, Server as HttpServer } from 'http';
import * as express from 'express';
import * as socketIo from 'socket.io';
import * as dotenv from "dotenv";

import IServer from './interfaces/server';
import IMessage from './interfaces/message';
import IBattleShips from './interfaces/battle-ships';
import BattleShips from './battle-ships';
import Routes from './routes';
import IRoute from './interfaces/routes';
import Logger from './logger';
import ILogger from './interfaces/logger';

export default class Server implements IServer {
	private readonly PORT: number = 4000;
	private readonly timerInterval: number = 20000;

	private app: express.Application;
	private server: HttpServer;
	private io: SocketIO.Server;
	private port: string | number;
	private battleShips: IBattleShips;
	private routes: IRoute;
	private logger: ILogger;
	private timer: any;

	constructor() {
		dotenv.config();
		this.app = express();
		this.port = process.env.PORT || this.PORT;
		this.server = createServer(this.app);
		this.io = socketIo(this.server);
		this.logger = new Logger();
		this.battleShips = new BattleShips({ logger: this.logger });
		this.routes = new Routes({ app: this.app, battleShips: this.battleShips, logger: this.logger });
		this.timer = setInterval(this.myTimer, this.timerInterval);

		this.listen();
	}

	private listen(): void {
		try {
			this.server.listen(this.port, () => {
				this.logger.set(`Server running on port ${ this.port }`);
			});
	
			this.io.on('connect', (socket: any) => {
				this.logger.set(`Connected client on port ${ this.port }`);
	
				socket.on('battle-ships-data', (data: IMessage) => {
					const messages = this.battleShips.handle({ ...data, socketId: socket.id });
	
					messages.forEach((message: IMessage) => this.io.to(message.socketId).emit('battle-ships-data', message));
				});
	
				socket.on('disconnect', () => {
					this.logger.set('Client disconnected');
				});
			});
		} catch (err) {
			this.logger.set(err.message);
		}
	}

	private myTimer = () => {
		const messages = this.battleShips.checkIn();

		messages.forEach((message: IMessage) => this.io.to(message.socketId).emit('battle-ships-data', message));
	}
}