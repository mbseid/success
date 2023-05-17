import React, { useState, useEffect } from 'react';
import { AutoForm, AutoField, ErrorsField, SubmitField } from 'uniforms-mui';
import { LinkBridge as schema } from '~/api/links';
import Chip from '@mui/material/Chip';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { useTracker, useSubscribe } from 'meteor/react-meteor-data';
import { Links } from '~/api/links';
import { useNavigate, useParams } from "react-router-dom";
import Page from '../components/Page';
import { Grid, Button, Container, Stack, Typography } from '@mui/material';
import LinkForm from './LinkForm';

export const EditLink = () => {
    const params = useParams();
    const navigate = useNavigate();

    const model = useTracker(() => Links.findOne({_id: params.id}));

    const handleSubmit = (link) => {
        Links.update(link._id, {
          $set: {
            title: link.title,
            description: link.description,
            tags: link.tags
          }
        })
        navigate("/links");
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
            {model &&
              <LinkForm handleSubmit={handleSubmit}
                        prefilledModel={model} />
            }
          </Grid>
        </Container>
      </Page>
    );
};
