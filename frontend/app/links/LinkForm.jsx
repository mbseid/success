import React, { useState, useEffect } from 'react';
import { AutoForm, AutoField, ErrorsField, SubmitField } from 'uniforms-mui';
import { LinkBridge as schema } from '~/api/links';
import Chip from '@mui/material/Chip';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

export default function LinkForm({handleSubmit, prefilledModel}){
    const [tags, setTags] = useState(prefilledModel.tags || []);
    const [tagList, setTagList] = useState([]);

    useEffect(() => {
        Meteor.call('links.distinctTags', {}, (err, res) => {
            setTagList(res)
        })
    }, [])

    const preSubmit = (value) => {
      const link = {
        ...value,
        tags: tags
      }
      handleSubmit(link)
    }

    return (
      <AutoForm schema={schema}
                model={prefilledModel}
                onSubmit={preSubmit}>
        <AutoField name="title" />
        <AutoField name="url" />
        <AutoField name="description" />
        <Autocomplete
            multiple
            value={tags}
            onChange={(event, newTags) => setTags(newTags)}
            id="tags-outlined"
            sx={{ marginTop: '8px', marginBottom: '8px' }}
            options={tagList}
            defaultValue={[]}
            freeSolo
            renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                    <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                ))
            }
            renderInput={(params) => (
                <TextField
                    {...params}
                    label="Tags"
                    placeholder="Tags"
                />
            )}
        />
        <ErrorsField />
        <SubmitField />
    </AutoForm>
    );
};
