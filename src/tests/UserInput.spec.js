import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import UserInput from '../components/UserInput.svelte'

describe('UserInput Component', () => {
  test('should render the component', async () => {
    const user = userEvent.setup()
    render(UserInput, { userInput: 'user-input' })

    const container = screen.queryByText('Two-way binding')
    const input = container.children[0]

    expect(input.value).toBe('user-input')

    await user.click(input)
    await user.keyboard('-edit')

    expect(input.value).toBe('user-input-edit')
  })
})
