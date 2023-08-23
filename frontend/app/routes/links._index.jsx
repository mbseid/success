import { useState, useMemo } from 'react';
import useDebounce from '~/utils/debounce';
import { Link as RouterLink, useLoaderData, useFetcher } from '@remix-run/react';
import { json } from '@remix-run/node';
// material
import { Grid, Button, Container, Stack, Typography } from '@mui/material';
// components
import Page from '~/components/Page';
import { LinkCard, LinksSort } from '~/components/link';
import SearchBar from '~/components/SearchBar';
import AddIcon from '@mui/icons-material/Add';

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

export const meta = () => {
  return [{ title: "Links | Success" }];
}

export default function Links(){
  const { links } = useLoaderData();
  const [searchQuery, setSearchQuery] = useState('');

  const linkSearch = useFetcher();

  const searchLinks = (query) => {
    setSearchQuery(query);
    debouncedRequest()
  }

  const debouncedRequest = useDebounce(() => {
    linkSearch.submit({ query: searchQuery }, {
      method: "get",
      action: `/links/search`,
    });
  }, 900);
  
  return (
    <Page title="Links">
      <Container>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4" gutterBottom>
            Links
          </Typography>
          <Button variant="contained" component={RouterLink} to="/links/new" startIcon={<AddIcon />}>
            New Link
          </Button>
        </Stack>

        <Stack mb={5} direction="row" alignItems="center" justifyContent="space-between">
          <SearchBar placeholder="Search links..." setSearchQuery={searchLinks}/>
          {/* <LinksSort options={[]} /> */}
        </Stack>

        <Grid container spacing={3}>
          {(linkSearch.state === "idle" && linkSearch.data && searchQuery) ?
          <>
            {linkSearch.data.search.map((link) => (
              <LinkCard key={link.id} item={link} />
            ))}
          </>
          :
          <>
            {links.map((link) => (
              <LinkCard key={link.id} item={link} />
            ))}
          </>}
        </Grid>
      </Container>
    </Page>
  );
}
