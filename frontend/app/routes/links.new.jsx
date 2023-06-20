import React from 'react';
import { useNavigate, useSearchParams, useActionData } from "@remix-run/react";
import { redirect } from "@remix-run/node"; // or cloudflare/deno

import Page from '~/components/Page';
import { Grid, Button, Container, Stack, Typography } from '@mui/material';
import LinkForm from '~/components/link/LinkForm';
import { graphQLClient, gql } from '~/graphql';
import { formDataToJson } from '~/utils/formUtils';

const CreateLink = gql`
mutation ($data: LinkInput!) {
  createLink(data: $data) {
    id
  }
}
`;


export const action = async ({ request }) => {
  const formData = await request.formData();
  const link = formDataToJson(formData)
  const links = await graphQLClient.mutate({
    mutation: CreateLink,
    variables: {
      data: link
    }
  })
  return redirect(`/links`);
};

export const loader = async({})
export default function NewLink() {
    const actionData = useActionData();

    const [searchParams, setSearchParams] = useSearchParams();

    const prefilledModel = {
        title: searchParams.get('title') || "",
        url: searchParams.get('url') || "",
        tags: []
    }

    return (
      <Page title="Add Link">
        <Container>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
            <Typography variant="h4" gutterBottom>
              Add Link
            </Typography>
          </Stack>
          <Grid container>
            <LinkForm path='/links/new'
                      prefilledModel={prefilledModel} />
          </Grid>
        </Container>
      </Page>
    );
};
