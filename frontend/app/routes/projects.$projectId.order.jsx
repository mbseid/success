import { gql, graphQLClient } from '~/graphql';
import { json } from "@remix-run/node";

const Reorder = gql`
mutation ReorderProject($projectId: UUID!, $order: Int!){
    reorderProject(projectID: $projectId, order: $order){
        id
    }
}
`

export async function action({ request, params }){
    const { order} = await request.json()
    const { data } = await graphQLClient.query({
        query: Reorder,
        variables: {
            projectId: params.projectId,
            order
        }
    });
    return json({ ...data });
}