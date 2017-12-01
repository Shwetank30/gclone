import express from 'express';
import { apolloServer } from 'apollo-server';

import schema from './api/schema';

const PORT= 3010;

const app = express();

app.use('/graphql', apolloServer({
  graphiql: true,
  pretty: true,
  mocks: {},
  schema,
}));

app.listen(PORT, () => console.log(
  `Server running at http://localhost:${PORT}`
));
