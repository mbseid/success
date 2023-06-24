import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { Container, Grid, Stack, Typography } from '@mui/material';
import Page from '~/components/Page';
import LinkForm from '~/components/link/LinkForm';
import { gql, graphQLClient } from '~/graphql';
import { formDataToJson } from '~/utils/formUtils';


const query = gql`
  query GetLinks($linkId: ID!) {
    link(pk: $linkId){
      id
      title
      url
      tags
    }
    tags
  }
`;

const UpdateLink = gql`
mutation ($data: LinkInput!, $filters: LinkFilter) {
  updateLinks(data: $data, filters: $filters) {
    id
  }
}
`;
export async function loader({ request, params }){
    const { data } = await graphQLClient.query({
        query,
        variables: {
            linkId: params.linkId
        }
    });
    return json({ ...data });
}

export const action = async ({ request, params }) => {
  const formData = await request.formData();
  const link = formDataToJson(formData)
  const links = await graphQLClient.mutate({
    mutation: UpdateLink,
    variables: {
      data: link,
      filters: {
        id: {
          exact: params.linkId
        }
      }
    }
  })
  return redirect(`/links`);
};

export default function EditLink() {
    const actionData = useLoaderData();
    const { link, tags } = useLoaderData();

    const prefilledModel = {
      title: link.title,
      url: link.url,
      tags: link.tags
    }

    return (
      <Page title="Edit Link">
        <Container>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
            <Typography variant="h4" gutterBottom>
              Edit Link
            </Typography>
          </Stack>
          <Grid container>
              <LinkForm path={`/links/${link.id}/edit`}
                        prefilledModel={prefilledModel}
                        globalTags={tags}/>
          </Grid>
        </Container>
      </Page>
    );
};
