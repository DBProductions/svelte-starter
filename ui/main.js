import App from './components/App.svelte';
/**
 * create the main component
 */
const app = new App({
    target: document.querySelector('app'),
    data: {
        list: [
            {id: 1, name: 'Babel', url: 'https://babeljs.io/'},
            {id: 2, name: 'Svelte', url: 'https://svelte.technology/'},
            {id: 3, name: 'Rollup', url: 'https://rollupjs.org/'}
        ]
    }
});
/**
 * listen to events
 * 'select' clicking a list item set the headline
 * 'input' set result from user input
 */
app.on('select', event => {
    app.set({
        message: `Clicked item ${event.item.name}`,
        itemId: `Id: ${event.item.id}`
    });
});
app.on('input', event => {
    app.set({result: ''})
    if (event.input) {
       app.set({
           result: `User typed <small>(${event.input.length} chars)</small>: ${event.input}`
       });
    }
});
