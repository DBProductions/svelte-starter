import babel from 'rollup-plugin-babel'
import svelte from 'rollup-plugin-svelte'
import nodeResolve from 'rollup-plugin-node-resolve'

let plugins = [
  babel({
    exclude: ['node_modules/**', 'ui/components/**', 'templates/**'],
    plugins: ['external-helpers', 'transform-object-rest-spread']
  }),
  nodeResolve({
    jsnext: true
  }),
  svelte({
    include: 'ui/components/**.svelte',
    css: css => {
      css.write('public/css/main.css')
    },
    cascade: false
  })
]

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
