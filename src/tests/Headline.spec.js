import { render, screen } from '@testing-library/svelte'
import Headline from '../components/Headline.svelte'

describe('Headline Component', () => {
  test('should render the component', async () => {
    const { getByText, component } = render(Headline, { message: 'Headline' })

    const firstTabNode = getByText(/Headline/i)
    expect(firstTabNode).toBeTruthy()

    expect(screen.queryByText('Headline')).toBeTruthy()

    await component.$set({ message: 'Another Headline' })
    expect(screen.queryByText('Another Headline')).toBeTruthy()
  })
})

test('should render with small addition', () => {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const instance = new Headline({
    target: host,
    props: { message: 'Headline', itemId: 'Vitest' },
  })

  expect(instance).toBeTruthy()
  expect(host.innerHTML).toContain('Headline')
  expect(host.innerHTML).toContain('small')
  expect(host.innerHTML).toContain('Vitest')
})
