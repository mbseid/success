import React, { useState, useEffect } from 'react';
import { AutoForm, AutoField, ErrorsField, SubmitField } from 'uniforms-mui';
import { PeopleBridge as schema, People } from '~/api/people';
import { useNavigate } from "react-router-dom";
import Page from '../components/Page';
import { Grid, Button, Container, Stack, Typography } from '@mui/material';

export default function NewPerson(){
    const navigate = useNavigate();

    const handleSubmit = (person) => {
        People.insert(person)
        navigate("/people");
    }

    return (
      <Page title="Add Person">
        <Container>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
            <Typography variant="h4" gutterBottom>
              Add Person
            </Typography>
          </Stack>
          <Grid container>
            <AutoForm onSubmit={handleSubmit}
                      schema={schema}>
              <AutoField name="name" />
              <AutoField name="email" />
              <AutoField name="team" />
              <AutoField name="role" />
              <ErrorsField />
              <SubmitField />
            </AutoForm>
          </Grid>
        </Container>
      </Page>
    );
};
