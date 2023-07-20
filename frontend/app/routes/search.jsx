import { gql, graphQLClient } from '~/graphql';
import { json } from "@remix-run/node";

const Search = gql`
query Search($query: String!, $type: String!){
    search(query: $query, type: $type){
        __typename
        ... on Link {
            id
            title
            url
            tags
        }
        ... on Person {
            id
            name
            team
            role
            logs(pagination: { offset: 0, limit: 1 }, order: { date: DESC }){
                id
                note
                date
            }
        }
    }
}
`

export async function loader({ request }){
    const query = new URL(request.url).searchParams.get('query');
    const itemType = new URL(request.url).searchParams.get('type');
    const { data } = await graphQLClient.query({
        query: Search,
        variables: {
            query: query,
            type: itemType
        }
    });
    return json({ ...data });
}