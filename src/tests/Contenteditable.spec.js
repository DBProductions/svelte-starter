import { render } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import Contenteditable from '../components/Contenteditable.svelte'

describe('Contenteditable Component', () => {
  test.skip('should render the component', async () => {
    const user = userEvent.setup()
    const { getByText } = render(Contenteditable, { content: 'Test' })

    const firstTabNode = getByText(/Test/i)

    await user.click(firstTabNode)
    await user.keyboard('Edit')
    await user.click(document.body)

    const secondTabNode = getByText(/TestEdit/i)

    expect(firstTabNode).toBeTruthy()
    expect(secondTabNode).toBeTruthy()
  })
})
