import { useState } from 'react';
import { Link as RouterLink, useLoaderData } from '@remix-run/react';
import { json } from '@remix-run/node';
// material
import { Grid, Button, Container, Stack, Typography } from '@mui/material';
// components
import Page from '~/components/Page';
import Iconify from '~/components/Iconify';
import { LinkCard, LinksSort } from '~/components/link';
import SearchBar from '~/components/SearchBar';

import { graphQLClient, gql } from '~/graphql';

const query = gql`
  query GetLinks {
    links {
      id
      title
      url
      tags
    }
    tags
  }
`;
export async function loader({ request, params }){
    const { data } = await graphQLClient.query({
        query,
    });
    return json({ ...data });
}
export default function Links(){
  const { links } = useLoaderData();
  const [searchQuery, setSearchQuery] = useState('')
  
  return (
    <Page title="Links">
      <Container>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4" gutterBottom>
            Links
          </Typography>
          <Button variant="contained" component={RouterLink} to="/links/new" startIcon={<Iconify icon="eva:plus-fill" />}>
            New Link
          </Button>
        </Stack>

        <Stack mb={5} direction="row" alignItems="center" justifyContent="space-between">
          <SearchBar placeholder="Search links..." setSearchQuery={setSearchQuery}/>
          {/* <LinksSort options={[]} /> */}
        </Stack>

        <Grid container spacing={3}>
          {links.map((link) => (
            <LinkCard key={link.id} item={link} />
          ))}
        </Grid>
      </Container>
    </Page>
  );
}
