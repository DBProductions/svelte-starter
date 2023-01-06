describe('Table Component', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('Sort table', () => {
    cy.get('table.tbl > thead > tr > th:nth-child(1)').click()

    cy.get('table.tbl > thead > tr > th:nth-child(1)')
      .invoke('attr', 'data-order')
      .should('contain', 'desc')

    cy.get('table.tbl > tbody > tr:nth-child(1) > td:nth-child(2)').should(
      'have.text',
      'Svelte'
    )

    cy.get('table.tbl > tbody > tr:nth-child(2) > td:nth-child(2)').should(
      'have.text',
      'Rollup'
    )

    cy.get('table.tbl > tbody > tr:nth-child(3) > td:nth-child(2)').should(
      'have.text',
      'Cypress'
    )

    cy.get('table.tbl > tbody > tr:nth-child(4) > td:nth-child(2)').should(
      'have.text',
      'Prettier'
    )

    cy.get('table.tbl > thead > tr > th:nth-child(1)').click()

    cy.get('table.tbl > thead > tr > th:nth-child(1)')
      .invoke('attr', 'data-order')
      .should('contain', 'asc')

    cy.get('table.tbl > thead > tr > th:nth-child(2)').click()

    cy.get('table.tbl > thead > tr > th:nth-child(2)')
      .invoke('attr', 'data-order')
      .should('contain', 'desc')

    cy.get('table.tbl > tbody > tr:nth-child(1) > td:nth-child(2)').should(
      'have.text',
      'Cypress'
    )

    cy.get('table.tbl > tbody > tr:nth-child(2) > td:nth-child(2)').should(
      'have.text',
      'Prettier'
    )

    cy.get('table.tbl > tbody > tr:nth-child(3) > td:nth-child(2)').should(
      'have.text',
      'Rollup'
    )

    cy.get('table.tbl > tbody > tr:nth-child(4) > td:nth-child(2)').should(
      'have.text',
      'Svelte'
    )

    cy.get('table.tbl > thead > tr > th:nth-child(2)').click()

    cy.get('table.tbl > thead > tr > th:nth-child(2)')
      .invoke('attr', 'data-order')
      .should('contain', 'asc')
  })

  it('Click table row', () => {
    cy.get('table.tbl > tbody > tr:nth-child(2)')
      .click()
      .should('have.class', 'active')

    cy.get('#container > div:nth-child(1) > h1').should(
      'have.text',
      'Clicked item Rollup Id: 2'
    )

    cy.get('table.tbl > tbody > tr:nth-child(1)')
      .click()
      .should('have.class', 'active')

    cy.get('#container > div:nth-child(1) > h1').should(
      'have.text',
      'Clicked item Svelte Id: 1'
    )

    cy.get('table.tbl > tbody > tr:nth-child(3)')
      .click()
      .should('have.class', 'active')

    cy.get('#container > div:nth-child(1) > h1').should(
      'have.text',
      'Clicked item Cypress Id: 3'
    )

    cy.get('table.tbl > tbody > tr:nth-child(4)')
      .click()
      .should('have.class', 'active')

    cy.get('#container > div:nth-child(1) > h1').should(
      'have.text',
      'Clicked item Prettier Id: 4'
    )
  })
})
