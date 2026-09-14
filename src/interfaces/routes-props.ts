import { Application } from 'express';
import IBattleShips from './battle-ships';
import ILogger from './logger';

export default interface IRoutesProps {
	app: Application;
	battleShips: IBattleShips;
	logger: ILogger
}