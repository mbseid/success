import { gql, graphQLClient } from '~/graphql';
import { json } from "@remix-run/node";

const SearchLinks = gql`
query SearchLinks($query: String!){
    search(query: $query, type: "link"){
        __typename
        ... on Link {
            id
            title
            url
            tags
        }
    }
}
`

export async function loader({ request }){
    const query = new URL(request.url).searchParams.get('query');
    const { data } = await graphQLClient.query({
        query: SearchLinks,
        variables: {
            query: query
        }
    });
    return json({ ...data });
}