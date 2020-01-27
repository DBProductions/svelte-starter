import App from './App.svelte';

const app = new App({
  target: document.body,
  props: {
    list: [
      {id: 1, name: 'Svelte', url: 'https://svelte.technology/'},
      {id: 2, name: 'Rollup', url: 'https://rollupjs.org/'},
      {id: 3, name: 'Sapper', url: 'https://sapper.svelte.dev/'}
    ]
  }
});

export default app;