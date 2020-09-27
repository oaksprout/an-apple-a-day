import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client'
import { CSSReset, theme, ThemeProvider } from '@chakra-ui/core'
import { FatalErrorBoundary, RedwoodProvider } from '@redwoodjs/web'
import ReactDOM from 'react-dom'
import FatalErrorPage from 'src/pages/FatalErrorPage'
import Routes from 'src/Routes'
import './index.css'

const client = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/aave/protocol-multy-raw',
  cache: new InMemoryCache(),
})

ReactDOM.render(
  <FatalErrorBoundary page={FatalErrorPage}>
    <RedwoodProvider>
      <ApolloProvider client={client}>
        <ThemeProvider theme={theme}>
          <CSSReset />
          <Routes />
        </ThemeProvider>
      </ApolloProvider>
    </RedwoodProvider>
  </FatalErrorBoundary>,
  document.getElementById('redwood-app')
)
