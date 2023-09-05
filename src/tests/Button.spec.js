import { render } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import Button from '../components/Button.svelte'

describe('Button Component', () => {
  test('should render the component and click', async () => {
    const user = userEvent.setup()
    const { getByRole, component } = render(Button)

    // Mock function
    let text = ''
    const mock = vi.fn((event) => (text = event.detail.text))
    component.$on('click', mock)

    const button = getByRole('button')
    await user.click(button)

    expect(button.innerHTML).toBe('Button')
    expect(mock).toHaveBeenCalled()
  })
})
