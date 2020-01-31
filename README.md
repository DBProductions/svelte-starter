# svelte-starter

Works with verion 3.0.0 of Svelte.  

Starter repository for the cybernetically enhanced web apps.  
[Svelte Tutorial](https://svelte.dev/tutorial/basics)  
[Svelte Template](https://github.com/sveltejs/template)    
[Awesome Svelte](https://github.com/flagello/awesome-sveltejs)  

This starter repository is only a simple example, the project template got adjusted!  
No generator or guide how to use Svelte or how to organize your code.  

Some basic components are defined and wrapped in a main component.  

    App
        - Headline
        - List
            - ListItem
        - Transitions
        - RadioBoxes
        - ModalDialog/ModalForm
            - Modal
        - UserInput
        - Contenteditable

A store `stores.js` defines `userActivity` to reset a timer, this gets triggered from `mousemove`, `click` and `keydown`.  
It's only an example to use a store and display the inactive time of a user and react on window events.  

## Installation

    $ npm i

## Format code

    $ npmr run format

## Run or build

    $ npm run dev
    $ npm run build

## Browse

Navigate to [localhost:5000](http://localhost:5000).

## Feedback
Star this repo if you found it useful. Use the github issue tracker to give feedback on this repo.
