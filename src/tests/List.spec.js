import { render } from '@testing-library/svelte'
import List from '../components/List.svelte'

describe('List Component', () => {
  test('should render the component', async () => {
    const list = [
      { id: 0, name: 'Item 1', url: 'https://test-one.com' },
      { id: 0, name: 'Item 2', url: 'https://test-two.com' },
    ]
    const { getByText } = render(List, { list })

    expect(getByText(/Item 1/i)).toBeTruthy()
    expect(getByText(/Item 2/i)).toBeTruthy()
    expect(getByText(/https:\/\/test-one.com/i)).toBeTruthy()
    expect(getByText(/https:\/\/test-two.com/i)).toBeTruthy()
  })
})
