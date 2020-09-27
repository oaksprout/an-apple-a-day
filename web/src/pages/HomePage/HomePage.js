import { formatReserves } from '@aave/protocol-js'
import { gql, useQuery } from '@apollo/client'
import axios from 'axios'
import { useState } from 'react'
import { useQuery as useReactQuery } from 'react-query'
import {
  Spinner,
  Avatar,
  Flex,
  Text,
  Link,
  Button,
  IconButton,
  Heading,
  Box,
  SimpleGrid,
  Grid,
  Select,
  Input,
  InputGroup,
  InputRightAddon,
  PseudoBox,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/core'
import { useDebounce } from 'use-debounce'

const getPrices = async (_, assetIds) => {
  const { data } = await axios.get(
    `https://api.coingecko.com/api/v3/simple/price?ids=${assetIds}&vs_currencies=usd`
  )
  return data
}

function usePrices(assetIds) {
  return useReactQuery(['prices', assetIds], getPrices)
}

const RESERVES = gql`
  query GetReserves {
    reserves {
      id
      decimals
      baseLTVasCollateral
      reserveLiquidationThreshold
      symbol
      price {
        priceInEth
      }
    }
  }
`

const HomePage = () => {
  const { loading, error, data } = useQuery(RESERVES)

  const { loading: ethLoading, error: ethError, data: ethData } = usePrices(
    'ethereum'
  )

  const ethPrice = !ethLoading && ethData?.ethereum?.usd

  const reserves = (!loading && !error && formatReserves(data?.reserves)) || []

  const initialCurrentDeposit = { reserve: { id: '' }, amount: 0 }
  const initialCurrentBorrow = { reserve: { id: '' }, amount: 0 }

  const [currentDeposit, setCurrentDeposit] = useState(initialCurrentDeposit)
  const [currentBorrow, setCurrentBorrow] = useState(initialCurrentBorrow)
  const [deposits, setDeposits] = useState([
    // { reserve: yfiReserve, amount: '6.44447' },
    // { reserve: lendReserve, amount: '142239.40317' },
  ])
  const [borrows, setBorrows] = useState([
    // { reserve: usdtReserve, amount: '45995' },
    // { reserve: tusdReserve, amount: '9796.62025' },
  ])

  const [dDeposits] = useDebounce(deposits, 0)
  const [dBorrows] = useDebounce(borrows, 0)

  const handleDepositSubmit = (e) => {
    e.preventDefault()
    setDeposits([...dDeposits, currentDeposit])
    setCurrentDeposit(initialCurrentDeposit)
  }

  const handleDepositAmountUpdate = (thisDeposit, newAmount) => {
    const newDeposits = dDeposits.map((deposit) => {
      if (thisDeposit.id === deposit.id) {
        return {
          ...deposit,
          amount: newAmount,
        }
      }
      return deposit
    })

    setDeposits(newDeposits)
  }

  const handleDepositPriceUpdate = (thisDeposit, newPriceInUsd) => {
    const newPriceInEth = newPriceInUsd / ethPrice

    const newDeposits = dDeposits.map((deposit) => {
      if (thisDeposit.id === deposit.id) {
        return {
          ...deposit,
          reserve: {
            ...deposit.reserve,
            price: {
              ...deposit.reserve.price,
              priceInEth: newPriceInEth || '',
            },
          },
        }
      }
      return deposit
    })

    setDeposits(newDeposits)
  }

  const handleBorrowAmountUpdate = (thisBorrow, newAmount) => {
    const newBorrows = dBorrows.map((borrow) => {
      if (thisBorrow.id === borrow.id) {
        return {
          ...borrow,
          amount: newAmount,
        }
      }
      return borrow
    })

    setBorrows(newBorrows)
  }

  const handleBorrowPriceUpdate = (thisBorrow, newPriceInUsd) => {
    const newPriceInEth = newPriceInUsd / ethPrice

    const newBorrows = borrows.map((borrow) => {
      if (thisBorrow.id === borrow.id) {
        return {
          ...borrow,
          reserve: {
            ...borrow.reserve,
            price: { ...borrow.reserve.price, priceInEth: newPriceInEth },
          },
        }
      }
      return borrow
    })

    setBorrows(newBorrows)
  }

  const handleBorrowSubmit = (e) => {
    e.preventDefault()
    setBorrows([...dBorrows, currentBorrow])
    setCurrentBorrow(initialCurrentBorrow)
  }

  const depositSumInEth = deposits.reduce((r, b) => {
    return r + Number(b?.amount) * Number(b?.reserve?.price?.priceInEth)
  }, 0)

  const borrowSumInEth = dBorrows.reduce((r, b) => {
    return r + Number(b?.amount) * Number(b?.reserve?.price?.priceInEth)
  }, 0)

  const liquidationThresholdSum = deposits.reduce((r, b) => {
    return r + Number(b?.reserve?.reserveLiquidationThreshold)
  }, 0)

  const sumOfDepositLiquidations = dDeposits.reduce((r, b) => {
    return (
      r +
      Number(b?.amount) *
        Number(b?.reserve?.price?.priceInEth) *
        Number(b?.reserve?.reserveLiquidationThreshold)
    )
  }, 0)

  const healthFactor =
    // (depositSumInEth * liquidationThresholdSum) / borrowSumInEth
    sumOfDepositLiquidations / borrowSumInEth

  const handleRemoveDeposit = (removeDeposit) => {
    const newDeposits = dDeposits.filter(
      (deposit) => deposit.id !== removeDeposit.id
    )
    setDeposits(newDeposits)
  }

  const handleRemoveBorrow = (removeBorrow) => {
    const newBorrows = dBorrows.filter(
      (borrow) => borrow.id !== removeBorrow.id
    )
    setBorrows(newBorrows)
  }

  if (loading)
    return (
      <Box textAlign="center" p={50}>
        <Spinner />
      </Box>
    )
  if (error) return <p>Error :(</p>

  const formatHealthFactor = (healthFactor) => {
    if (healthFactor < 1) {
      return <Text color="red.500">{healthFactor.toFixed(2)} ☠️</Text>
    } else if (healthFactor >= 1 && healthFactor < 2) {
      return <Text color="orange.500">{healthFactor.toFixed(2)} ⚠️</Text>
    } else if (healthFactor >= 2 && healthFactor < Infinity) {
      return <Text color="green.500">{healthFactor.toFixed(2)} 🍏</Text>
    }

    return '--'
  }

  return (
    <Box p={3}>
      <Box mb={5}>
        <Heading size="2xl" mb={3}>
          An Apple a Day 🍏
        </Heading>
        <Text>Keeps the Aave Liquidators 👻 Away…</Text>
      </Box>
      {/* <div>depositSumInEth: {depositSumInEth}</div>
      <div>liquidationThresholdSum: {liquidationThresholdSum}</div>
      <div>borrowSumInEth: {borrowSumInEth}</div>
      <div>USD Price of ETH: {ethPrice}</div> */}
      <Box>
        <SimpleGrid spacing={3} minChildWidth="400px">
          <Box mb={5}>
            <Heading size="md" mb={3}>
              Health Factor
            </Heading>
            <Heading size="2xl" mb={3}>
              {formatHealthFactor(healthFactor)}
            </Heading>
            {(dDeposits.length < 1 || dBorrows.length < 1) && (
              <Text>Add at least 1 deposit and 1 borrow</Text>
            )}
          </Box>
          <Box mb={5}>
            <Heading size="md" mb={3}>
              Deposits
            </Heading>
            <form onSubmit={(e, data) => handleDepositSubmit(e, data)}>
              <SimpleGrid columns={3} spacing={3} mb={3}>
                <Select
                  onChange={(e) =>
                    setCurrentDeposit({
                      ...currentDeposit,
                      reserve: reserves.filter(
                        (reserve) => reserve.id === e.target.value
                      )[0],
                    })
                  }
                  value={currentDeposit?.reserve?.id}
                  required
                >
                  <option value="">Select asset</option>
                  {reserves.map((reserve) => (
                    <option key={reserve.id} value={reserve.id}>
                      {reserve.symbol}
                    </option>
                  ))}
                </Select>
                <NumberInput
                  value={currentDeposit.amount || ''}
                  onChange={(value) =>
                    setCurrentDeposit({
                      ...currentDeposit,
                      amount: value,
                    })
                  }
                  step={10}
                  placeholder="Amount deposited"
                >
                  <NumberInputField type="number" placeholder="Amount" />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Button size="md" type="submit">
                  Add Deposit
                </Button>
              </SimpleGrid>
            </form>
            <Box borderWidth={1} rounded="lg">
              {dDeposits.length > 0 ? (
                <>
                  <Box p={3}>
                    <SimpleGrid columns={2} spacing={3}>
                      <Heading size="sm">Asset amount</Heading>
                      <Heading size="sm">Price (USD)</Heading>
                    </SimpleGrid>
                  </Box>
                  {dDeposits?.map((deposit) => (
                    <PseudoBox
                      key={deposit?.reserveId}
                      borderTopWidth={1}
                      p={3}
                      _first={{ borderTopWidth: 0 }}
                    >
                      <SimpleGrid columns={2} spacing={3}>
                        <InputGroup>
                          <NumberInput
                            value={deposit?.amount || ''}
                            onChange={(value) =>
                              handleDepositAmountUpdate(deposit, value)
                            }
                            roundedRight={0}
                            step={10}
                          >
                            <NumberInputField type="number" roundedRight={0} />
                            <NumberInputStepper roundedRight={0}>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                          <InputRightAddon
                            children={deposit?.reserve?.symbol}
                          />
                        </InputGroup>
                        <Flex>
                          <NumberInput
                            value={
                              +(
                                deposit?.reserve?.price.priceInEth * ethPrice
                              ).toFixed(2) || ''
                            }
                            onChange={(value) =>
                              handleDepositPriceUpdate(deposit, value)
                            }
                            step={0.01}
                            precision={2}
                            mr={2}
                            min={0}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                          <IconButton
                            icon="delete"
                            onClick={(deposit) => handleRemoveDeposit(deposit)}
                          />
                        </Flex>
                      </SimpleGrid>
                    </PseudoBox>
                  ))}
                </>
              ) : (
                <Box p={5} textAlign="center">
                  No deposits
                </Box>
              )}
            </Box>
          </Box>
          <Box mb={5}>
            <Heading size="md" mb={3}>
              Borrows
            </Heading>
            <form onSubmit={(e, data) => handleBorrowSubmit(e, data)}>
              <SimpleGrid columns={3} spacing={3} mb={3}>
                <Select
                  onChange={(e) =>
                    setCurrentBorrow({
                      ...currentBorrow,
                      reserve: reserves.filter(
                        (reserve) => reserve.id === e.target.value
                      )[0],
                    })
                  }
                  value={currentBorrow?.reserve?.id}
                  required
                >
                  <option value="">Select asset</option>
                  {reserves.map((reserve) => (
                    <option key={reserve.id} value={reserve.id}>
                      {reserve.symbol}
                    </option>
                  ))}
                </Select>
                <NumberInput
                  value={currentBorrow.amount || ''}
                  onChange={(value) =>
                    setCurrentBorrow({
                      ...currentBorrow,
                      amount: value,
                    })
                  }
                  step={0.01}
                >
                  <NumberInputField type="number" placeholder="Amount" />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Button size="md" type="submit">
                  Add Borrow
                </Button>
              </SimpleGrid>
            </form>
            <Box borderWidth={1} rounded="lg">
              {dBorrows.length > 0 ? (
                <>
                  <Box p={3}>
                    <SimpleGrid columns={2} spacing={3}>
                      <Heading size="sm">Asset amount</Heading>
                      <Heading size="sm">Price (USD)</Heading>
                    </SimpleGrid>
                  </Box>
                  {dBorrows?.map((borrow) => (
                    <PseudoBox
                      key={borrow?.reserveId}
                      borderTopWidth={1}
                      p={3}
                      _first={{ borderTopWidth: 0 }}
                    >
                      <SimpleGrid columns={2} spacing={3}>
                        <InputGroup>
                          <NumberInput
                            value={+borrow?.amount.toFixed(2) || ''}
                            onChange={(value) =>
                              handleBorrowAmountUpdate(borrow, value)
                            }
                            roundedRight={0}
                            step={10}
                          >
                            <NumberInputField type="number" roundedRight={0} />
                            <NumberInputStepper roundedRight={0}>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                          <InputRightAddon children={borrow?.reserve?.symbol} />
                        </InputGroup>
                        <Flex>
                          <NumberInput
                            value={
                              +(
                                borrow?.reserve?.price.priceInEth * ethPrice
                              ).toFixed(2) || ''
                            }
                            onChange={(value) =>
                              handleBorrowPriceUpdate(borrow, value)
                            }
                            precision={2}
                            step={0.01}
                            mr={2}
                          >
                            <NumberInputField type="number" />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                          <IconButton
                            icon="delete"
                            onClick={(borrow) => handleRemoveBorrow(borrow)}
                          />
                        </Flex>
                      </SimpleGrid>
                    </PseudoBox>
                  ))}
                </>
              ) : (
                <Box p={5} textAlign="center">
                  No borrows
                </Box>
              )}
            </Box>
          </Box>
        </SimpleGrid>
      </Box>
      <Box mt="25%">
        <Box mb={3}>
          If this saved you money or if you want me to make improvements,
          <br />
          <Link
            href="https://etherscan.io/address/0x22f5500133c00e821d392e6e4d8336f44c6c02b7"
            color="green.500"
          >
            send a tip
          </Link>{' '}
          and{' '}
          <Link href="https://twitter.com/tannedoaksprout" color="green.500">
            let me know
          </Link>
        </Box>
        <Box>
          <Text mb={3}>
            To hear when I release more crypto investing tools,
            <br />
            <Link href="https://twitter.com/tannedoaksprout" color="green.500">
              follow me @tannedoaksprout on Twitter
            </Link>
          </Text>
          <Link href="https://twitter.com/tannedoaksprout">
            <Avatar
              src="https://pbs.twimg.com/profile_images/1228631846726049792/eJn9xjAo_400x400.jpg"
              size="sm"
              name="Oaksprout"
            />
          </Link>
        </Box>
      </Box>
    </Box>
  )
}

export default HomePage
