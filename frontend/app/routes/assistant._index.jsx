import Grid from '@mui/material/Unstable_Grid2';
import { TextField, Button } from '@mui/material';
import Page from '~/components/Page';



export default function Assistant(){
    
    const submit = () => {

    }

    return (
        <Page title="Assistant">
            <h1>Assistant</h1>
            <Grid container spacing={2}>
                <Grid xs={4}>
                    <h2>Prompt List</h2>
                    <Button variant="contained" onClick={submit}>Ask</Button>
                </Grid>
                <Grid xs={8}>
                    <h2>Ask Away</h2>
                    <TextField fullWidth multiline minRows={12}/>
                    <Button variant="contained" onClick={submit}>Ask</Button>
                </Grid>
                
            </Grid>
        </Page>
    )
}