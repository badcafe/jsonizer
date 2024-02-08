import typescript from 'rollup-plugin-typescript2';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { dts } from 'rollup-plugin-dts';
import pkg from './package.json' assert { type: 'json' };

export default [{
	input: ['src/index.ts'],
	output: [{
		file: pkg.exports['.'].require.default,
		format: 'cjs'
	}, {
		file: pkg.exports['.'].import.default,
		format: 'es'
	}],
	plugins: [
		typescript({
            tsconfigOverride: {
                compilerOptions: {
                    removeComments: true,
                    declaration: false,
                    declarationMap: false,
                    inlineSources: false
                }
            }
        }),
		nodeResolve(),
		commonjs(),
	],
	external: ['reflect-metadata']
},
{
    input: './build/index.d.ts',
    output: [{
        file: 'dist/index.d.mts',
        format: 'es'
    }, {
        file: 'dist/index.d.cts',
        format: 'cjs'
    }],
    plugins: [dts()],
}];
