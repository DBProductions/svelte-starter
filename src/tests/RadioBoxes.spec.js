import { render } from '@testing-library/svelte'
import RadioBoxes from '../components/RadioBoxes.svelte'

describe('List Component', () => {
  test('should render the component', async () => {
    const selections = [
      {
        selector: 'A',
        label: 'A',
        text: '<p>This is the selection <strong>A</strong>.<br>It shows the information for A.</p>',
      },
      {
        selector: 'B',
        label: 'B',
        text: '<p>This is the selection <strong>B</strong>.<br>It shows the information for B.</p>',
      },
    ]
    const { getByText, getByLabelText } = render(RadioBoxes, { selections })

    expect(getByLabelText(/A/i)).toBeTruthy()
    expect(getByLabelText(/B/i)).toBeTruthy()
    expect(getByText(/The user selected nothing./i)).toBeTruthy()
    expect(getByText(/Nothing to display./i)).toBeTruthy()
  })
})
