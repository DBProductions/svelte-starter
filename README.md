# svelte-starter  

Starter repository for the cybernetically enhanced web apps.  
Works with Svelte v3.48.0 and NodeJS v16.17.1 (with npm@8.19.2).  
[Prettier](https://prettier.io/) for code formatting and [Cypress](https://www.cypress.io/) for end-to-end testing.  
[Rollup](https://rollupjs.org/) as module bundler.  

[Svelte Tutorial](https://svelte.dev/tutorial/basics)  
[Svelte Template](https://github.com/sveltejs/template)    
[Awesome Svelte](https://github.com/flagello/awesome-sveltejs)    

[svelte-devtools](https://github.com/sveltejs/svelte-devtools)

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

## Check

    $ npm run svelte-check

## Format code

    $ npm run format

## Run or build

    $ npm run dev
    $ npm run build

## Browse

Navigate to [localhost:10001](http://localhost:10001).

## Cypress
You can start the Cypress UI or run it headless on CLI.

    $ npm run start:cypress
    $ npm run test:cypress

## Feedback
Star this repo if you found it useful. Use the github issue tracker to give feedback on this repo.
