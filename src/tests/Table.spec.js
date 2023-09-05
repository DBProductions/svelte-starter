import { render } from '@testing-library/svelte'
import Table from '../components/Table.svelte'

describe('Tabble Component', () => {
  test('should render the component', async () => {
    const data = {
      header: [
        { value: 'ID', type: 'number' },
        { value: 'Name', type: 'string' },
        { value: 'URL', type: 'string' },
      ],
      entries: [
        { id: 1, name: 'Cypress', url: 'https://cypress.io/' },
        { id: 2, name: 'Vitest', url: 'https://vitest.dev/' },
      ],
    }
    const { component } = render(Table, { data })

    expect(component).toBeTruthy()
  })
})
