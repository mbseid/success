import { redirect } from "@remix-run/node";
import { graphQLClient, gql } from '~/graphql';

const DeleteLink = gql`
mutation ($filters: LinkFilter) {
  deleteLinks(filters: $filters) {
    id
  }
}
`;

export const action = async ({ request, params }) => {
    const links = await graphQLClient.mutate({
        mutation: DeleteLink,
        variables: {
            filters: {
                id: {
                    exact: params.linkId
                }
            }
        }
    });
    return redirect(`/links`);
};
  