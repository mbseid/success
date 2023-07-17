import { ApolloClient, gql as apolloGQL, InMemoryCache } from "@apollo/client";

export const graphQLClient = new ApolloClient({
    cache: new InMemoryCache(),
    ssrMode: true,
    uri: `${process.env.API_HOST}/graphql`
});

export const gql = apolloGQL;