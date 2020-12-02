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
  Stack,
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

  // const [deposits] = useDebounce(deposits, 0)
  // const [borrows] = useDebounce(borrows, 0)

  const handleDepositSubmit = (e) => {
    e.preventDefault()
    setDeposits([...deposits, currentDeposit])
    setCurrentDeposit(initialCurrentDeposit)
  }

  const handleDepositAmountUpdate = (thisDeposit, newAmount) => {
    const newDeposits = deposits.map((deposit) => {
      if (thisDeposit.reserve.id === deposit.reserve.id) {
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

    const newDeposits = deposits.map((deposit) => {
      if (thisDeposit.reserve.id === deposit.reserve.id) {
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
    const newBorrows = borrows.map((borrow) => {
      if (thisBorrow.reserve.id === borrow.reserve.id) {
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
      if (thisBorrow.reserve.id === borrow.reserve.id) {
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
    setBorrows([...borrows, currentBorrow])
    setCurrentBorrow(initialCurrentBorrow)
  }

  const depositSumInEth = deposits.reduce((r, b) => {
    return r + Number(b?.amount) * Number(b?.reserve?.price?.priceInEth)
  }, 0)

  const borrowSumInEth = borrows.reduce((r, b) => {
    return r + Number(b?.amount) * Number(b?.reserve?.price?.priceInEth)
  }, 0)

  const liquidationThresholdSum = deposits.reduce((r, b) => {
    return r + Number(b?.reserve?.reserveLiquidationThreshold)
  }, 0)

  const sumOfDepositLiquidations = deposits.reduce((r, b) => {
    return (
      r +
      Number(b?.amount) *
        Number(b?.reserve?.price?.priceInEth) *
        Number(b?.reserve?.reserveLiquidationThreshold)
    )
  }, 0)

  const healthFactor =
    sumOfDepositLiquidations / borrowSumInEth

  const handleRemoveDeposit = (removeDeposit) => {
    const newDeposits = deposits.filter(
      (deposit) => deposit.reserve.id !== removeDeposit.reserve.id
    )
    setDeposits(newDeposits)
  }

  const handleRemoveBorrow = (removeBorrow) => {
    const newBorrows = borrows.filter(
      (borrow) => borrow.reserve.id !== removeBorrow.reserve.id
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
    <Box p={5}>
      <Box mb={5}>
        <Heading size="2xl" mb={3}>
          An Apple a Day
        </Heading>
        <Text>Keeps the Aave Liquidators Away…</Text>
      </Box>
      <Box>
        <Stack direction="row" spacing={3} wrap="wrap">
          <Box mb={5} minWidth={300}>
            <Heading size="md" mb={3}>
              Health Factor
            </Heading>
            <Heading size="2xl" mb={3}>
              {formatHealthFactor(healthFactor)}
            </Heading>
            {(deposits.length < 1 || borrows.length < 1) && (
              <Text>Add at least 1 deposit and 1 borrow</Text>
            )}
          </Box>
          <Box  minWidth={400}>
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
                    {reserves.filter(
                      reserve =>
                        !deposits.map(deposit => deposit.reserve.id)
                          .includes(reserve.id))
                          .map((reserve) => (
                            <option key={reserve.id} value={reserve.id}>
                              {reserve.symbol}
                            </option>
                          )
                    )}
                  </Select>
                  <NumberInput
                    value={currentDeposit.amount || ''}
                    onChange={(value) =>
                      setCurrentDeposit({
                        ...currentDeposit,
                        amount: value,
                      })
                    }
                    step={0.01}
                    placeholder="Amount deposited"
                  >
                    <NumberInputField
                      type="number"
                      placeholder="Amount"
                      step={0.01}
                    />
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
                {deposits.length > 0 ? (
                  <>
                    <Box p={3}>
                      <SimpleGrid columns={2} spacing={3}>
                        <Heading size="sm">Asset amount</Heading>
                        <Heading size="sm">Price (USD)</Heading>
                      </SimpleGrid>
                    </Box>
                    {deposits?.map((deposit) => (
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
                              onClick={() => handleRemoveDeposit(deposit)}
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
                    {reserves
                      .filter(
                      reserve =>
                        !borrows.map(borrow => borrow.reserve.id)
                          .includes(reserve.id))
                        .map((reserve) => (
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
                    <NumberInputField
                      type="number"
                      placeholder="Amount"
                      step={0.01}
                    />
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
                {borrows.length > 0 ? (
                  <>
                    <Box p={3}>
                      <SimpleGrid columns={2} spacing={3}>
                        <Heading size="sm">Asset amount</Heading>
                        <Heading size="sm">Price (USD)</Heading>
                      </SimpleGrid>
                    </Box>
                    {borrows?.map((borrow) => (
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
                              onClick={() => handleRemoveBorrow(borrow)}
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
          </Box>
        </Stack>
      </Box>
      <Box mt={5}>
        <Box>
          <Text mb={3}>
            Worried about impermanent loss?<br />Check out my other tool – <Link color="green.500" href="https://baller.netlify.app">🏀 $BALLER</Link> – which helps you calculate IL in liquidity pools.
          </Text>
          <Text mb={3}>
            To hear when I release more crypto investing tools,
            <br />
            <Link href="https://twitter.com/tannedoaksprout" color="green.500">
              follow me on Twitter @tannedoaksprout
            </Link>.
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
