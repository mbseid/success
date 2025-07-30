import { graphQLClient, gql } from '~/graphql';

const CLICK_LINK_MUTATION = gql`
  mutation ClickLink($linkId: UUID!) {
    clickLink(linkId: $linkId) {
      id
      clickCount
    }
  }
`;

export async function action({ request, params }) {
  if (request.method !== "PATCH") {
    throw new Response("Method not allowed", { status: 405 });
  }

  const { linkId } = params;

  try {
    await graphQLClient.mutate({
      mutation: CLICK_LINK_MUTATION,
      variables: { linkId }
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error tracking link click:', error);
    throw new Response("Internal Server Error", { status: 500 });
  }
} 