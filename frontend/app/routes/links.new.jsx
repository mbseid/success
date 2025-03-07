import React from 'react';
import { useNavigate, useSearchParams, useActionData, useLoaderData } from "@remix-run/react";
import { redirect, json } from "@remix-run/node";
import { Link as RouterLink } from "@remix-run/react";

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

const TagsQuery = gql`
  query GetLinkTags {
    tags
  }
`;

export const action = async ({ request }) => {
  const formData = await request.formData();
  const link = formDataToJson(formData);
  
  // Create a new link (no longer checking for duplicates here)
  const links = await graphQLClient.mutate({
    mutation: CreateLink,
    variables: {
      data: link
    }
  });
  
  return redirect(`/links`);
};

export const loader = async () => {
  const { data } = await graphQLClient.query({
    query: TagsQuery
  })
  return json(data);
}

export default function NewLink() {
    const actionData = useActionData();
    const { tags } = useLoaderData();
    const [searchParams, setSearchParams] = useSearchParams();

    const prefilledModel = {
        title: searchParams.get('title') || "",
        url: searchParams.get('url') || "",
        tags: []
    };

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
                      prefilledModel={prefilledModel}
                      globalTags={tags} 
                      checkUrlExists={true} />
          </Grid>
        </Container>
      </Page>
    );
};
