import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import replace from 'rollup-plugin-replace';
import {eslint} from 'rollup-plugin-eslint';

const libraryName = 'svelte-router';
const input = './src/index.ts';
const extensions = ['.js', '.ts'];
const plugins = [
  resolve({extensions}),
  commonjs(),
  eslint(),
  babel({
    extensions,
    exclude: 'node_modules/**',
  }),
  replace({
    'process.env.NODE_ENV': JSON.stringify('production'),
  }),
];

export default
{
  input,
  output: [
    {
      file: './lib/'+ libraryName +'.esm.js',
      format: 'esm',
    },
    {
      file: './lib/'+ libraryName +'.js',
      format: 'cjs',
      exports: 'named',
    },
  ],
  plugins,
  external: [
    '@spaceavocado/type-check',
    'svelte',
    'svelte/store',
  ],
};
