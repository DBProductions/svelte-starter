import { render } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import Contenteditable from '../components/Contenteditable.svelte'

describe('Contenteditable Component', () => {
  test('should render the component', async () => {
    const user = userEvent.setup()
    const { getByText } = render(Contenteditable, { content: 'Test' })

    const firstTabNode = getByText(/Test/i)

    await user.click(firstTabNode)
    await user.keyboard('-edit')

    const secondTabNode = getByText(/Test-edit/i)

    expect(firstTabNode).toBeTruthy()
    expect(secondTabNode).toBeTruthy()
  })
})
