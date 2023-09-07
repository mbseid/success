import { gql, graphQLClient } from '~/graphql';
import { json } from "@remix-run/node";

const SpdateScratchPadValue = gql`
  mutation UpdateScratchPad($body: String!) {
    updateScratchPad(body: $body){
        body
    }
  }
`;

export async function action({ request, params }){
    const { body } = await request.json()
    const { data } = await graphQLClient.query({
        query: SpdateScratchPadValue,
        variables: {
            body
        }
    });
    return json({ ...data });
}