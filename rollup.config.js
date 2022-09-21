import typescript from 'rollup-plugin-typescript2';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import pkg from './package.json';

export default [{
	input: 'src/index.ts',
	output: [{
		file: pkg.exports['.'].require,
		format: 'cjs'
	}, {
		file: pkg.exports['.'].import,
		format: 'es'
	}],
	plugins: [
		typescript(),
		nodeResolve(),
		commonjs()
	],
	external: ['reflect-metadata']
}];
