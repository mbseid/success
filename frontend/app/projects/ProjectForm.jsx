import React, { useState, useEffect } from 'react';
import { AutoForm, AutoField, ErrorsField, SubmitField } from 'uniforms-mui';
import { ProjectBridge as schema } from '~/api/projects';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import {
    TextField,
  } from '@mui/material';
import { Box } from '@mui/system';

export default function ProjectForm({handleSubmit, prefilledModel}){

    const [due, setDue] = useState(prefilledModel.due || new Date())

    const preSubmit = (project) => {
        project.due = due;
        handleSubmit(project)
    }

    return (
      <AutoForm schema={schema}
                model={prefilledModel}
                onSubmit={preSubmit}>
        <AutoField name="name" />
        <AutoField name="description" />
        <Box sx={{py: 1}}>
            <DesktopDatePicker
            label="Due Date"
            inputFormat="MM/dd/yyyy"
            value={due}
            onChange={(newDate) => setDue(newDate)}
            renderInput={(params) => <TextField {...params} />}
            />
        </Box>
        <ErrorsField />
        <SubmitField />
    </AutoForm>
    );
};
