import React, { useState, useEffect } from 'react';
import Chip from '@mui/material/Chip';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { useFormik } from 'formik';
import { useSubmit, useFetcher } from '@remix-run/react'
import * as yup from 'yup';
import { jsonToFormData } from '~/utils/formUtils';
import useDebounce from '~/utils/debounce';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';


const linkValidation = yup.object({
    title: yup
      .string()
      .required(),
    url: yup
      .string()
      .url()
      .required(),
    tags: yup
      .array().of(yup.string())
  });

export default function LinkForm({path, prefilledModel, globalTags = [], checkUrlExists = true}){
    const submit = useSubmit();
    const urlChecker = useFetcher();
    const [urlChecked, setUrlChecked] = useState(false);
    const [existingLink, setExistingLink] = useState(null);

    const formik = useFormik({
        initialValues: prefilledModel,
        validationSchema: linkValidation,
        onSubmit: (values) => {
          // Don't submit if we found an existing URL
          if (existingLink) {
            return;
          }
          
          submit(jsonToFormData(values), {
            method: "post",
            action: path
          })
        }
    });

    // Check URL existence when user types
    useEffect(() => {
        // Skip URL checking if checkUrlExists is false
        if (!checkUrlExists) {
            return;
        }

        // Reset existingLink when URL changes
        setExistingLink(null);
        setUrlChecked(false);
        
        // If URL is valid, check if it exists after a delay
        if (formik.values.url && !formik.errors.url) {
            debouncedUrlCheck();
        }
    }, [formik.values.url, checkUrlExists]);

    const debouncedUrlCheck = useDebounce(() => {
        if (formik.values.url && !formik.errors.url) {
            urlChecker.submit(
                { query: formik.values.url },
                { method: "get", action: "/links/search" }
            );
            setUrlChecked(true);
        }
    }, 500);

    // Update existingLink when we get a response
    useEffect(() => {
        if (urlChecker.data && urlChecker.data.search) {
            // Find an exact URL match in the search results
            const exactMatch = urlChecker.data.search.find(
                link => link.url.toLowerCase() === formik.values.url.toLowerCase()
            );
            setExistingLink(exactMatch || null);
        }
    }, [urlChecker.data, formik.values.url]);

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
        {urlChecked && existingLink && (
          <Alert severity="warning" sx={{ my: 2 }}>
            This URL already exists as "{existingLink.title}". 
            <Link href={`/links/${existingLink.id}/edit`} sx={{ ml: 1 }}>
              Edit existing link
            </Link>
          </Alert>
        )}
        <Autocomplete
            multiple
            value={formik.values.tags}
            onChange={(e, values) => formik.setFieldValue("tags", values)}
            id="tags"
            name="tags"
            labels="Tags"
            options={globalTags}
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
        <Button 
          color="primary" 
          variant="contained" 
          fullWidth 
          type="submit"
          disabled={existingLink !== null}
        >
          Submit
        </Button>
    </form>
    );
};
