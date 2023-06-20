import React, { useState, useEffect } from 'react';
import Chip from '@mui/material/Chip';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { useFormik } from 'formik';
import { useSubmit } from '@remix-run/react'
import * as yup from 'yup';
import { jsonToFormData } from '~/utils/formUtils';


const linkValidation = yup.object({
    title: yup
      .string()
      .required(),
    url: yup
      .string()
      .required(),
    tags: yup
      .array().of(yup.string())
  });

export default function LinkForm({path, prefilledModel, tags = []}){
    const [tags, setTags] = useState(prefilledModel.tags || []);
    const submit = useSubmit();


    const formik = useFormik({
        initialValues: prefilledModel,
        validationSchema: linkValidation,
        onSubmit: (values) => {
          submit(jsonToFormData(values), {
            method: "post",
            action: path
          })
        }
    });
    return (
      <form onSubmit={formik.handleSubmit}>
        <TextField
          fullWidth
          id="title"
          name="title"
          label="Title"
          value={formik.values.title}
          onChange={formik.handleChange}
          error={formik.touched.title && Boolean(formik.errors.title)}
          helperText={formik.touched.title && formik.errors.title}
        />
        <TextField
          fullWidth
          id="url"
          name="url"
          label="URL"
          value={formik.values.url}
          onChange={formik.handleChange}
          error={formik.touched.url && Boolean(formik.errors.url)}
          helperText={formik.touched.url && formik.errors.url}
        />
        <Autocomplete
            multiple
            value={formik.values.tags}
            onChange={(e, values) => formik.setFieldValue("tags", values)}
            id="tags"
            name="tags"
            labels="Tags"
            options={tags}
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
        <Button color="primary" variant="contained" fullWidth type="submit">
          Submit
        </Button>
    </form>
    );
};
