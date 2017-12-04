import express from 'express';
import { apolloServer } from 'apollo-server';

import { schema, resolvers } from './api/schema';
// import { GitHubConnector } from './api/github/connector';
import { Repositories } from './api/github/models';
import { Entries } from './api/sql/models';

const PORT= 3010;

const app = express();

app.use('/graphql', apolloServer(() => {
  return {
    graphiql: true,
    pretty: true,
    resolvers,
    schema,
    context: {
      Repositories: new Repositories(),
      Entries:  new Entries(),

    }
  };

}));

app.listen(PORT, () => console.log(
  `Server running at http://localhost:${PORT}`
));
