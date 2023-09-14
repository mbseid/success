import {
  Link,
  useNavigate,
  useLoaderData
} from "@remix-run/react";
import { json } from '@remix-run/node';

import { useState } from 'react';

// @mui
import { Grid, Container, Typography, Card, styled } from '@mui/material';
import TextField from '@mui/material/TextField';
// components
import Page from '~/components/Page';
import useDebounce from '~/utils/debounce';
import AppWidgetSummary from '~/dashboard/AppWidgetSummary';

import LinkIcon from '@mui/icons-material/Link';
import PersonIcon from '@mui/icons-material/Person';

import { colorCode as projectColorCode } from '~/utils/colors';

import { graphQLClient, gql } from '~/graphql';
import ProjectList from "~/components/ProjectList";

const query = gql`
  query GetCounts {
    count {
      people
      link
    }
    projects(order: { order: ASC }, filters: { complete: false }) {
      id
      name
      due
      order
    }
    scratchpad{
      body
    }
  }
`;
export async function loader({ request, params }){
    const { data } = await graphQLClient.query({
        query,
    });
    return json({ ...data });
}

const UnstyledLink = styled(Link)((theme) => {
  return {
    color: 'inherit',
    textDecoration: 'inherit'
  }
})

export const meta = () => {
  return [
    { title: "Success" }
  ];
};

export default function Index() {
  const { count, projects, scratchpad } = useLoaderData();

  const [scratchPadValue, setScratchPadValue] = useState(scratchpad.body);

  const postScratchPad = useDebounce(() => {
    const body = scratchPadValue

    fetch(`/scratchpad`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          body
        })  
      }
    )
  }, 500);

  const updateScratchPad = (e) => {
    setScratchPadValue(e.target.value);

    postScratchPad();
  }

  const navigate = useNavigate();

  return (
    <Page title="Dashboard">
      <Container maxWidth="xl">
        <Typography variant="h4" sx={{ mb: 5 }}>
        ⛰ Climb Your Mountain ⛰
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={6}>
            <Card sx={{
              height: '100%'
            }}>
              <ProjectList projects={projects} />
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <AppWidgetSummary
              title="Link Count"
              total={count.link}
              icon={<LinkIcon />}
              onClick={() => navigate('/links')} />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <AppWidgetSummary
              title="People"
              total={count.people}
              color="info"
              icon={<PersonIcon />}
              onClick={() => navigate('/people')}/>
          </Grid>

          <Grid item xs={12} sm={12} md={12}>
            <Typography variant="h4">Scratch Pad</Typography>
            <TextField
                id="outlined-multiline-static"
                multiline
                rows={10}
                sx={{width: "100%"}}
                value={scratchPadValue}
                onChange={updateScratchPad}
              />
          </Grid>
         
          {/*
          <Grid item xs={12} sm={6} md={3}>
            <AppWidgetSummary title="Item Orders" total={1723315} color="warning" icon={'ant-design:windows-filled'} />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <AppWidgetSummary title="Bug Reports" total={234} color="error" icon={'ant-design:bug-filled'} />
          </Grid>
          */}
        </Grid>
      </Container>
    </Page>
  );
}
