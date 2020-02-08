export default interface ILogger {
	set(message: string): void;
	get(): string[];
}