import { useState } from 'react'

const ReserveRow = ({reserve}) => {
  const [deposited, setDeposited] = useState(0)
  const [borrowed, setBorrowed] = useState(0)

  return (
    <tr>
      <td>{reserve.symbol}</td>
      <td>{(reserve.price.priceInEth * 366.57).toFixed(2)}</td>
      <td>
        <input
          type="number"
          value={deposited}
          onChange={(e) => setDeposited(e.target.value)}
        />
      </td>
      <td>
        <input
          type="number"
          value={borrowed}
          onChange={(e) => setBorrowed(e.target.value)}
        />
      </td>
      <td>hello</td>
    </tr>
  )
}

export default ReserveRow
