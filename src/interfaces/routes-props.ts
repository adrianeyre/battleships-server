import * as express from 'express';
import IBattleShips from './battle-ships';
import ILogger from './logger';

export default interface IRoutesProps {
	app: express.Application;
	battleShips: IBattleShips;
	logger: ILogger
}