# Development log

All of the steps I'm taking to build this app, from start to finish.

### Part 1: Concept and tech

I've written down all of the stuff I want to demonstrate about building an app with Apollo. I've also made a list of technology choices:

- Apollo server - to put a nice unified API on top of our GitHub and local data
- Apollo client - to load that data declaratively into our UI
- React - it's a great way to build UIs, and has the best integration with Apollo and Redux
- React router - it seems to be the most popular React router today, and has some great hooks and techniques for SSR.
- Babel - to compile our server code.
- Redux - to manage client side data, perhaps we can also use Redux Form to manage the submission form, but we'll see when we get there.
- Passport.js for login - this seems to be the most common login solution for Express/Node, and has a great GitHub login solution.
- SQL for local data
- Bootstrap for styling - I already know how to use it, and I don't want the styling to be the focus of the app. Let's keep it as simple as possible.

I drew a quick mockup of the desired UI. It's quite simple, and should be easy to implement in bootstrap.

### Part 2:

We want to make this app as simple as possible, but also useful. I think I'll design it the way I would a real app, and then simplify if necessary. Here are some ideas for different views in the app:

- Home page: "Hot" feed, which ranks by number of upvotes and time since posting
- "new" page, which lists stuff that was just posted, but hasn't had time yet to be upvoted
- Submission page, which is a form that lets people put in info about the repository - perhaps it's just a link to the repo, maybe a comment as well?
- Repo page, where you can look at a particular repository, and its upvotes and comments

Given this, let's design our GraphQL schema for the app. I think this is a great place to start the process because it will let us set up some mocked data, and work on the UI and API in parallel as we need to.

#### Repository

This represents a repository on GitHub - all of its data is fetched from the GitHub API. I think it will be convenient to separate data from different APIs into different types in my schema, rather than having one type that merges both the local data (upvotes etc) and the GitHub data (description etc). This can theoretically have [all of the fields that GitHub returns](https://developer.github.com/v3/repos/#get), but we're probably interested mostly in high-level data like:

- Repository name
- Organization/author avatar
- Description
- Number of stars
- Number of issues
- Number of PRs
- Number of contributors
- Date created

#### Entry

This represents a GitHub repository submitted to GitHunt. It will have data specific to our application:

- User that posted this repository
- Date posted
- The related repository object from GitHub
- Display score (probably just upvotes - downvotes)
- Comments
- Number of comments

#### Comment

Just a comment posted on an entry.

- User that posted this comment
- Date posted
- Comment content

#### User

Someone that has logged in to the app.

- Username
- Avatar
- GitHub profile URL

#### In GraphQL schema language

Now let's put it all together to see what our GraphQL schema might look like. Let's keep in mind that this is just a sketch - the mechanics of our app might require some changes.

```graphql
# This uses the exact field names returned by the GitHub API for simplicity
type Repository {
  name: String!
  full_name: String!
  description: String
  html_url: String!
  stargazers_count: Number!
  open_issues_count: Number

  # We should investigate how best to represent dates
  created_at: String!
}

# Uses exact field names from GitHub for simplicity
type User {
  login
  avatar_url
  html_url
}

type Comment {
  postedBy: User!
  createdAt: String! # Actually a date
  content: String!
}

type Entry {
  repository: Repository!
  postedBy: User!
  createdAt: String! # Actually a date
  score: Number!
  comments: [Comment]! # Should this be paginated?
  commentCount: Number!
}
```

Looks pretty good so far! We might also want some root queries as entry points into our data. These are probably going to correlate to the different views we want for our data:

```graphql
# To select the sort order of the feed
enum FeedType {
  HOT
  NEW
}

type Query {
  # For the home page, after arg is optional to get a new page of the feed
  # Pagination TBD - what's the easiest way to have the client handle this?
  feed(type: FeedType!, after: String): [Entry]

  # For the entry page
  entry(repoFullName: String!): Entry

  # To display the current user on the submission page, and the navbar
  currentUser: User
}
```


OK, one last thing - we need to define a few mutations, which will be the way we modify our server-side data. These are basically just all of the actions a user can take in our app:

```graphql
# Type of vote
enum VoteType {
  UP
  DOWN
  CANCEL
}

type Mutation {
  # Submit a new repository
  submitRepository(repoFullName: String!): Entry

  # Vote on a repository
  vote(repoFullName: String!, type: VoteType!): Entry

  # Comment on a repository
  # TBD: Should this return an Entry or just the new Comment?
  comment(repoFullName: String!, content: String!): Entry
}
```

It's not yet clear to me what return values from mutations should be. There are a few possible approaches:

1. Return parent of thing being modified - then we can incorporate the result into the store more easily
2. Return the thing being modified - then we have to figure out where it goes into the store
3. Return the root query object itself, so that we can refetch anything we want after the mutation, in one request

I'd like to try all three eventually and see how they feel in this app. Apollo Client should probably have one or two situations that it deals with the best, so that we can recommend people use that for best results.


Mock schema created in src/schema.js
let's get apollo server going.


Mock server running after downgrading to depracting versions. Fix to be applied soon.

We are going to make our own backend system & we'll need the following:
1. One model for each GraphQL type we want to fetch: Repository, User, Comment & Entry
2. One connector for each type of backend we are fetching from GitHub API & SQL

Probably we want to start from the connectors, because those are more general. We should probably test them in some way. According to the connector document, we want our connectors to definitely do two things:

1. Batching - when we want to fetch multiple objects of the same type, we should batch them into one request if possible (for example, by running a query with an array of IDs, rather than many queries with one ID each)
2. Caching - if we make multiple requests for the same exact object in one query, we should make sure we only do one request if possible and reuse the result. So if we ask for a particular item from the GitHub API, we don't want to fetch it multiple times per request. In our case, we want to implement one more thing in our GitHub connector: ETags and conditional requests, which will let us check the API for changes without running into our rate limit: https://developer.github.com/v3/#conditional-requests

Let's start with the GitHub connector. I think we basically need just one method on the connector:

```
GitHub.getObject(url);
```

Since the GitHub API doesn't support any batching (we can't get multiple repository objects with one request, for example) we can't take advantage of having any more detailed information than the URL in the connector itself. Converting the object type and ID into the URL is something we can do in the model, which will be type-specific.

Let's go over the functionality we want in this connector:

1. It should pass the correct GitHub API key
2. It should not load the same GitHub URL twice in the same request, using something like [DataLoader](https://github.com/facebook/dataloader)
3. It should keep track of `ETag` headers for as many GitHub objects as possible, and send them with requests to both speed up API accesses and avoid hitting the rate limit
4. It doesn't need to send any authentication information other than our API key, because none of the data we are requesting is per-user (although we might want to add this in the future, since the rate limits on the GitHub API are per user)

This means that the connector needs to have both per-request and per-server state - per-request for (1) and per-server for (2). We can make further optimizations later if we end up hitting the GitHub API limit but this seems like a good start.

OK, I implemented a basic connector and tested (1) and (2). (3) is an optimization, so let's wire up the connector and try running some queries before we do that.

Alright, the GitHub API is going!

Next stop is implementing the SQL connector/models, so that we can actually insert some entries into our database.

<h3> Part - 4: Setting up SQL </h3>

We need to store local non-github data in SQL database.
These include comments & entry. We can base the schema of these in our database similar to that of the GraphQL schema.


What does that translate to in SQL types? We'll use [SQLite](https://www.sqlite.org/datatype3.html) type names. All should have timestamps and ids, just in case we need them (we're not trying to demo the most optimized SQL schema of all time in this particular app).

- `comments` table
  - `posted_by`: TEXT (GitHub username)
  - `created_at`: INTEGER (Unix time)
  - `content`: TEXT
  - `entry_id`: INTEGER
- `entries` table
  - `repository`: TEXT (GitHub name)
  - `posted_by`: TEXT (GitHub username)
  - `created_at`: INTEGER (Unix time)
- `votes` table (since we need to keep track of who has already upvoted a particular thing)
  - `entry_id`: INTEGER
  - `vote_value`: INTEGER (-1 or +1)
  - `username`: TEXT (GitHub username)

When we get to auth, we might need something to store login tokens as well, but we'll cross that bridge when we get there.

OK, after messing about with some various Knex and GraphQL stuff, we've also set up some simple seed data, and written some basic resolvers/models. There's still a good way to go until we have a good SQL connector, but we can move on for now. My goal is to get a backend that returns the data we want first, then optimize later.

There's a cool trick to simplify resolvers


```js
import { property, constant } from 'lodash';

...

createdAt: property('created_at'),
score: constant(0),
commentCount: constant(0),
```
Ok, a few more queries have been added to the SQL model. no caching/batching yet, but will be implemented soon.

### Part 5: Implement basic front-end

Config taken from [the Graph.Cool example app](https://github.com/graphcool-examples/react-apollo-todo-example).

Basic UI setup has been implemented.

Next up in part 6, we're gonna implement GitHub Login.
For this we'll use express & passport js for middleware. We'll maintain a server & it has it's advantages & disadvantages but for the sake of simplicity we're going to go with persistent login session authentication rather than using tokens with GraphQL.

Libraries we'll use:

- [passport](http://passportjs.org/)
- [passport-github](https://github.com/jaredhanson/passport-github)
- [express-session](https://github.com/expressjs/session)
- [connect-session-knex](https://github.com/llambda/connect-session-knex).

By default `fetch` dowsn't send cookies, and we need to pass the `credentials` option.
Hence this code was used in ui/index.js

```js
const client = new ApolloClient({
  networkInterface: createNetworkInterface('/graphql', {
    credentials: 'same-origin',
  }),
});
```
Some key notes, we used sqlite3 for dev & postgres for production & the library used was knex which I had to learn before setting it up. Migrations, seeds & blah blah.

Right now, I've been stuck in OAuth for a whole day & am gonna try to figure out how to get rid of the ClientID option not found error.

Resolved it by providing the clientID directly, I'll change it later to process.env variables.

Next up is adding voting for repository

Optimizations will be added soon.

Integrating voting mutation into the UI.
