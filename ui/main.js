import App from './components/App.svelte';

const app = new App({
    target: document.querySelector('app'),
    data: {
        list: [
            {id: 1, name: 'Babel'},
            {id: 2, name: 'Svelte'},
            {id: 2, name: 'Rollup'}
        ]
    }
});

app.on('select', event => {
    app.set({message: 'Clicked item ' + event.item.name})
});

app.on('input', event => {
    app.set({result: ''})
    if (event.input) {
       app.set({result: 'User typed: ' + event.input});
    }
});
