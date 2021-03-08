describe('List Component', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('Click list items', () => {
    // click on second item
    cy.get(
      'div.list-container > ul > li:nth-child(2) > div:nth-child(2)'
    ).click()

    cy.get('#container > div:nth-child(1) > h1').should(
      'have.text',
      'Clicked item Rollup Id: 2'
    )

    // click edit on second item
    cy.get(
      'div.list-container > ul > li:nth-child(2) > div:nth-child(1)'
    ).click()

    cy.get('#modalForm > div:nth-child(2) > input').should(
      'have.value',
      'Rollup'
    )

    cy.get('#modalForm > button.sendBtn').click()

    // click on first item
    cy.get(
      'div.list-container > ul > li:nth-child(1) > div:nth-child(2)'
    ).click()

    cy.get('#container > div:nth-child(1) > h1').should(
      'have.text',
      'Clicked item Svelte Id: 1'
    )

    cy.get(
      'div.list-container > ul > li:nth-child(1) > div:nth-child(1)'
    ).click()

    cy.get('#modalForm > div:nth-child(2) > input').should(
      'have.value',
      'Svelte'
    )

    cy.get('#modalForm > button.sendBtn').click()

    // click on third item
    cy.get(
      'div.list-container > ul > li:nth-child(3) > div:nth-child(2)'
    ).click()

    cy.get('#container > div:nth-child(1) > h1').should(
      'have.text',
      'Clicked item Cypress Id: 3'
    )

    cy.get(
      'div.list-container > ul > li:nth-child(3) > div:nth-child(1)'
    ).click()

    cy.get('#modalForm > div:nth-child(2) > input').should(
      'have.value',
      'Cypress'
    )

    cy.get('#modalForm > button.sendBtn').click()

    // click on forth item
    cy.get(
      'div.list-container > ul > li:nth-child(4) > div:nth-child(2)'
    ).click()

    cy.get('#container > div:nth-child(1) > h1').should(
      'have.text',
      'Clicked item Prettier Id: 4'
    )

    cy.get(
      'div.list-container > ul > li:nth-child(4) > div:nth-child(1)'
    ).click()

    cy.get('#modalForm > div:nth-child(2) > input').should(
      'have.value',
      'Prettier'
    )

    cy.get('#modalForm > button.sendBtn').click()
  })
})
