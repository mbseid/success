import { redirect } from "@remix-run/node";
import { graphQLClient, gql } from '~/graphql';
import { formDataToJson } from '~/utils/formUtils';


const CreatePersonLog = gql`
mutation ($data: PersonLogInput!) {
    createPersonLog(data: $data) {
        id
    }
}
`;

export const action = async ({ request, params }) => {
    const formData = await request.formData();
    const log = formDataToJson(formData);
    const create = await graphQLClient.mutate({
        mutation: CreatePersonLog,
        variables: {
            data: {
                person: {
                    set: params.personId
                },
                ...log
            }
        }
    });
    return redirect(`/people/${params.personId}`);
};
  