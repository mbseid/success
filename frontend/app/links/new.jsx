import React, { useState, useEffect } from 'react';
import { Links } from '~/api/links';
import { useNavigate, useSearchParams } from "react-router-dom";
import Page from '../components/Page';
import { Grid, Button, Container, Stack, Typography } from '@mui/material';
import LinkForm from './LinkForm';

export const NewLink = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const prefilledModel = {
        title: searchParams.get('title') || "",
        url: searchParams.get('url') || "",
        description: searchParams.get('description') || ""
    }

    const handleSubmit = (link) => {
        Links.insert(link)
        navigate("/links");
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
            <LinkForm handleSubmit={handleSubmit}
                      prefilledModel={prefilledModel} />
          </Grid>
        </Container>
      </Page>
    );
};
