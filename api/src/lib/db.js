// See https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/constructor
// for options.

import { PrismaClient } from '@prisma/client'

export const db = new PrismaClient()

// import { GraphQLClient } from 'graphql-request'

// export const request = async (query = {}) => {
//   const endpoint = 'https://graphql.fauna.com/graphql'

//   const graphQLClient = new GraphQLClient(endpoint, {
//     headers: {
//       authorization: 'Bearer <FAUNADB_KEY>',
//     },
//   })
//   try {
//     return await graphQLClient.request(query)
//   } catch (error) {
//     console.log(error)
//     return error
//   }
// }
