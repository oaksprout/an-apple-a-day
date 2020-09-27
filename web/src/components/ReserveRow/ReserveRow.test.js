import { render } from '@redwoodjs/testing'

import ReserveRow from './ReserveRow'

describe('ReserveRow', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<ReserveRow />)
    }).not.toThrow()
  })
})
