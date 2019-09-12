import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import postcss from 'rollup-plugin-postcss';
import postcssUrl from 'postcss-url';
import autoprefixer from 'autoprefixer';

export default [
    // JS
    {
        input: 'lib/js/main.js',
        output: [
            {
                file: 'dist/up360.cjs.js',
                format: 'cjs'
            },
            {
                file: 'dist/up360.cjs.min.js',
                format: 'cjs'
            },
            {
                file: 'dist/up360.esm.js',
                format: 'es'
            },
        ],
        plugins: [
            postcss({
                plugins: [
                    postcssUrl({
                        url: 'inline'
                    }),
                    autoprefixer()
                ],
                extract: 'dist/up360.css',
            }),
            resolve({
                only: [/^\.{0,2}\//],
            }),
            commonjs(),
            terser({
                include: [/^.+\.min\.js$/, '*esm*'], 
            }),
        ]
    },
    {
        input: 'lib/js/main.js',
        output: [
            {
                name: 'up360',
                file: 'dist/up360.umd.js',
                format: 'umd'
            },
            {
                name: 'up360',
                file: 'dist/up360.umd.min.js',
                format: 'umd'
            }
        ],
        plugins: [
            postcss({
                plugins: [
                    postcssUrl({
                        url: 'inline'
                    }),
                    autoprefixer()
                ],
                extract: 'dist/up360.min.css',
                minimize: true,
            }),
            resolve(),
            commonjs(),
            terser({
                include: [/^.+\.min\.js$/], 
            }),
        ]
    },
];