import { Link as RouterLink, useLoaderData, useFetcher } from '@remix-run/react';
import { json } from '@remix-run/node';
// material
import { Grid, Button, Container, Stack, Typography, Table,
    TableHead, TableRow, TableBody, TableCell } from '@mui/material';
// components
import Page from '~/components/Page';
import { graphQLClient, gql } from '~/graphql';
import { parseISO } from 'date-fns'


const query = gql`
  query GetLogs($offset: Int, $limit: Int) {
    systemLogs(order: { createDatetime: DESC }, pagination: { offset: $offset, limit: $limit }) {
      id
      msg
      trace
      createDatetime
    }
  }
`;
export async function loader({ request, params }){
    const { data } = await graphQLClient.query({
        query,
        variables: {
            offset: 0,
            limit: 20
        }
    });
    return json({ ...data });
}

export const meta = () => {
  return [{ title: "Logs | Settings" }];
}
export default function Logs(){
  const { systemLogs } = useLoaderData();
  
  return (
    <Page title="Logs">
      <Container>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4" gutterBottom>
            Logs
          </Typography>
        </Stack>

        <Grid container spacing={3}>
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
                <TableHead>
                    <TableRow>
                        <TableCell style={{ width: '20%' }}>Date</TableCell>
                        <TableCell style={{ width: '40%' }}>Message</TableCell>
                        <TableCell style={{ width: '40%' }}>Trace</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {systemLogs.map((log) => {
                        return (<TableRow
                                    key={log.id}
                                >
                                <TableCell component="th" scope="row">
                                    {parseISO(log.createDatetime).toDateString()}
                                    {" | "}
                                    {parseISO(log.createDatetime).toLocaleTimeString()}

                                </TableCell>
                                <TableCell>{log.msg}</TableCell>
                                <TableCell>{log.trace}</TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </Grid>
      </Container>
    </Page>
  );
}
