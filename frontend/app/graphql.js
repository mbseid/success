import { ApolloClient, gql as apolloGQL, InMemoryCache } from "@apollo/client";

export const graphQLClient = new ApolloClient({
    cache: new InMemoryCache(),
    ssrMode: true,
    uri: "http://web:8000/graphql"
});

export const gql = apolloGQL;