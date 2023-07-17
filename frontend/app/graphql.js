import { ApolloClient, gql as apolloGQL, InMemoryCache } from "@apollo/client";

export const graphQLClient = new ApolloClient({
    cache: new InMemoryCache(),
    ssrMode: true,
    uri: `${process.env.API_HOST}/graphql`,
    defaultOptions: {
        watchQuery: {
          fetchPolicy: 'no-cache',
          errorPolicy: 'all',
        },
        query: {
          fetchPolicy: 'no-cache',
          errorPolicy: 'all',
        },
      }
});

export const gql = apolloGQL;