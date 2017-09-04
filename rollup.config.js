import babel from 'rollup-plugin-babel';
import svelte from 'rollup-plugin-svelte';

let plugins = [
    babel({
        exclude: ['node_modules/**', 'ui/components/**', 'templates/**'],
        plugins: ['external-helpers', 'transform-object-rest-spread']
    }),
    svelte({
        include: 'ui/components/**.svelte'
    }),
];

export default {
    input: 'ui/main.js',
    output: {
        file: 'public/js/script.js',
        format: 'es',
        name: 'App',
        sourcemap: true
    },
    plugins
}
