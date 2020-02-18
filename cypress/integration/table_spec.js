describe('Table Component', () => {
  beforeEach(() => {
    cy.visit('/')
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
      'Clicked item Sapper Id: 3'
    )

    cy.get('table.tbl > tbody > tr:nth-child(4)')
      .click()
      .should('have.class', 'active')

    cy.get('#container > div:nth-child(1) > h1').should(
      'have.text',
      'Clicked item Cypress Id: 4'
    )
  })
})
