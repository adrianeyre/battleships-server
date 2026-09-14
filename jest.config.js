// Logger formats timestamps in local time, so pin the zone to keep runs deterministic.
process.env.TZ = process.env.TZ || 'Europe/London';

module.exports = {
	roots: ['<rootDir>/src'],
	transform: {
		'^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.spec.json' }],
	},
	testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
}
