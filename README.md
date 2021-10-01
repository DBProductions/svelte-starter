# svelte-starter  

Starter repository for the cybernetically enhanced web apps.  
Works with Svelte v3.43.1 and NodeJS v14.18.0 (with npm@6.14.15).  
[Prettier](https://prettier.io/) for code formatting and [Cypress](https://www.cypress.io/) for end-to-end testing.  
[Rollup](https://rollupjs.org/) as module bundler and [Volta](https://volta.sh/) as tool manager.  

[Svelte Tutorial](https://svelte.dev/tutorial/basics)  
[Svelte Template](https://github.com/sveltejs/template)    
[Awesome Svelte](https://github.com/flagello/awesome-sveltejs)    

This starter repository is only a simple example, the project template got adjusted!  
No generator or guide how to use Svelte or how to organize your code.  

Some basic components are defined and wrapped in a main component.  

    App
        - Button
        - Headline
        - List
            - ListItem
        - UserInput
        - Contenteditable
        - Table
        - RadioBoxes
        - ModalDialog/ModalForm
            - Modal
        - Profile
        - EventLog

Data used in the application is stored in `data.js`.

A store `stores.js` defines `userActivity` to reset a timer, this gets triggered from `mousemove`, `click` and `keydown`.  
It's only an example to use a store and display the inactive time of a user and react on window events.  

## Installation

    $ npm i

## Format code

    $ npm run format

## Run or build

    $ npm run dev
    $ npm run build

## Browse

Navigate to [localhost:10001](http://localhost:10001).

## Cypress

    $ npm run start:cypress

## Feedback
Star this repo if you found it useful. Use the github issue tracker to give feedback on this repo.
