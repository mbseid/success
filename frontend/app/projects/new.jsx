import React, { useState, useEffect } from 'react';
import { Projects } from '~/api/projects';
import { useNavigate } from "react-router-dom";
import Page from '../components/Page';
import { Grid, Button, Container, Stack, Typography } from '@mui/material';
import ProjectForm from './ProjectForm';

export const NewProject = () => {
    const navigate = useNavigate();

    const handleSubmit = (project) => {
      Projects.insert(project)
      navigate("/projects");
    }

    return (
      <Page title="Craete Project">
        <Container>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
            <Typography variant="h4" gutterBottom>
              Create Project
            </Typography>
          </Stack>
          <Grid container>
            <ProjectForm handleSubmit={handleSubmit}
                         prefilledModel={{}} />
          </Grid>
        </Container>
      </Page>
    );
};
