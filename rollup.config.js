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
    entry: 'ui/main.js',
    dest: 'public/js/script.js',
    format: 'es',
    plugins,
    sourceMap: false
}
