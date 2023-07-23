import {
  Link,
  useNavigate,
  useLoaderData
} from "@remix-run/react";
import { json } from '@remix-run/node';

// @mui
import { Grid, Container, Typography, Card, List, ListItem, ListItemText, ListItemSecondaryAction, CardActionArea, styled } from '@mui/material';
// components
import Page from '~/components/Page';
import AppWidgetSummary from '~/dashboard/AppWidgetSummary';

import AccountTreeIcon from '@mui/icons-material/AccountTree';
import LinkIcon from '@mui/icons-material/Link';
import PersonIcon from '@mui/icons-material/Person';

import { colorCode as projectColorCode } from '~/utils/colors';

import { graphQLClient, gql } from '~/graphql';

const query = gql`
  query GetCounts {
    count {
      people
      link
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

export default function Index(linkCount = 0, peopleCount = 0, projects = []) {
  const { count } = useLoaderData();

  projects = []
  const navigate = useNavigate();

  return (
    <Page title="Dashboard">
      <Container maxWidth="xl">
        <Typography variant="h4" sx={{ mb: 5 }}>
        ⛰ Climb Your Mountain ⛰
        </Typography>

        <Grid container spacing={3}>
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
          <Grid item xs={12} sm={6} md={6}>
            <Card sx={{
              height: '100%'
            }}>
              <UnstyledLink to="/projects">
                <Typography variant="h5" gutterBottom
                            sx={{
                              py: 1,
                              textAlign: 'center'
                            }}>
                  <AccountTreeIcon /> Projects
                </Typography>
              </UnstyledLink>
              <List>
                {projects.map((project) => (
                  <ListItem key={project._id}
                            sx={{
                              backgroundColor: projectColorCode(project)
                            }}>
                    <UnstyledLink to={`/projects/${project._id}`}>
                      <ListItemText
                        primary={project.name}
                        secondary={project.due.toDateString()} />
                      <ListItemSecondaryAction>
                          <Iconify icon={'mdi:arrow-right-circle-outline'} />
                      </ListItemSecondaryAction>
                    </UnstyledLink>
                  </ListItem>
                ))}
              </List>
            </Card>
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
