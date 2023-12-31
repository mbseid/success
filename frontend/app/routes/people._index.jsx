import { Link as RouterLink, useLoaderData, useFetcher } from '@remix-run/react';
import useDebounce from '~/utils/debounce';
import { json } from '@remix-run/node';

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat)

import { useState } from 'react';
// material
import {
  Card,
  Box,
  Table,
  Stack,
  Button,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Container,
  Typography,
  TableSortLabel,
  TableContainer,
  Link,
} from '@mui/material';
// components
import Page from '~/components/Page';
import AddIcon from '@mui/icons-material/Add';
import SearchNotFound from '~/components/SearchNotFound';
import SearchBar from '~/components/SearchBar';
import { graphQLClient, gql } from '~/graphql';


const TABLE_HEAD = [
  { id: 'name', label: 'Name', alignRight: false },
  { id: 'team', label: 'Team', alignRight: false },
  { id: 'role', label: 'Role', alignRight: false },
  { id: 'lastContact', label: 'Last Contact', alignRight: false },
  { id: '' },
];

const visuallyHidden = {
  border: 0,
  margin: -1,
  padding: 0,
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  position: 'absolute',
  whiteSpace: 'nowrap',
  clip: 'rect(0 0 0 0)',
};

function UserListHead({
  order,
  orderBy,
  headLabel,
  onRequestSort,
}) {
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        {headLabel.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.alignRight ? 'right' : 'left'}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              hideSortIcon
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <Box sx={{ ...visuallyHidden }}>{order === 'desc' ? 'sorted descending' : 'sorted ascending'}</Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}
const query = gql`
query GetPeople {
    people {
        id
        name
        team
        role
        logs(pagination: { offset: 0, limit: 1 }, order: { date: DESC }){
            id
            note
            date
        }
    }
}
`

export async function loader({ request, params }){
    const { data } = await graphQLClient.query({
        query,
    });
    return json({ ...data });
}

export const meta = () => {
  return [{ title: "People | Success" }];
}

export default function People() {
  const { people } = useLoaderData();

  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc');

  const [searchQuery, setSearchQuery] = useState('');

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const peopleSearch = useFetcher();

  const updateSearchQuery = (query) => {
    setSearchQuery(query);
    debouncedRequest()
  }

  const debouncedRequest = useDebounce(() => {
    peopleSearch.submit({ query: searchQuery, type: "person" }, {
      method: "get",
      action: `/search`,
    });
  }, 500);

  const peopleList = (searchQuery && peopleSearch.state === "idle" && peopleSearch.data) ? peopleSearch.data.search : people;

  return (
    <Page title="People">
      <Container>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4" gutterBottom>
            People
          </Typography>
          <Button variant="contained" component={RouterLink} to="/people/new" startIcon={<AddIcon />}>
            New Person
          </Button>
        </Stack>
        <Stack mb={5} direction="row" alignItems="center" justifyContent="space-between">
          <SearchBar placeholder="Search people..." setSearchQuery={updateSearchQuery}/>
          {/* <LinksSort options={[]} /> */}
        </Stack>

        <Card>
          <TableContainer sx={{ minWidth: 800 }}>
            <Table>
              <UserListHead
                  order={order}
                  orderBy={orderBy}
                  headLabel={TABLE_HEAD}
                  onRequestSort={handleRequestSort}
                />
              <TableBody>
                {peopleList.map((person) => {
                  const { id, name, team, role, logs } = person;

                  return (
                    <TableRow
                      key={id}
                    >
                      <TableCell component="th" scope="row">
                        <Link component={RouterLink} to={`/people/${id}`}>
                          {name}
                        </Link>
                      </TableCell>
                      <TableCell align="left">{team}</TableCell>
                      <TableCell align="left">{role}</TableCell>
                      <TableCell align="left">{logs[0] && dayjs(logs[0].date, "YYYY-MM-DD").format("MMMM DD, YYYY")}</TableCell>
                      <TableCell align="right">
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>

              {searchQuery != '' && people.length == 0 && (
                <TableBody>
                  <TableRow>
                    <TableCell align="center" colSpan={6} sx={{ py: 3 }}>
                      <SearchNotFound searchQuery={searchQuery} />
                    </TableCell>
                  </TableRow>
                </TableBody>
              )}
            </Table>
          </TableContainer>
        </Card>
      </Container>
    </Page>
  );
}