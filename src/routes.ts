import * as express from 'express';
import * as dotenv from "dotenv";

import IRoutes from './interfaces/routes';
import IRoutesProps from './interfaces/routes-props'
import IBattleShips from './interfaces/battle-ships';
import ILogger from './interfaces/logger';

export default class Routes implements IRoutes {
	private app: express.Application;
	private battleShips: IBattleShips;
	private logger: ILogger;
	private apiKey: string;

	constructor(props: IRoutesProps) {
		dotenv.config();
		this.apiKey = process.env.API_KEY || '';

		this.app = props.app;
		this.battleShips = props.battleShips;
		this.logger = props.logger;

		this.routes();
	}

	private routes = (): void => {
		this.app.get('/', (req, res) => res.send('Server Active!'));

		this.app.get(`/${ this.apiKey }/players`, (req, res) => res.json(this.battleShips.getPlayers()));

		this.app.get(`/${ this.apiKey }/logger`, (req, res) => res.json(this.logger.get()));
	}
}