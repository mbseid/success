import { redirect } from "@remix-run/node";
import { graphQLClient, gql } from '~/graphql';

const DeletePerson = gql`
mutation ($filters: PersonFilter) {
  deletePeople(filters: $filters) {
    id
  }
}
`;

export const action = async ({ request, params }) => {
    const links = await graphQLClient.mutate({
        mutation: DeletePerson,
        variables: {
            filters: {
                id: {
                    exact: params.personId
                }
            }
        }
    });
    return redirect(`/people`);
};
  