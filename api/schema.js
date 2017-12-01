const schema = `
# This uses the exact field names returned by the gitHub API for simplicity
type Repository {
  name: String!
  full_name: String!
  description: String
  html_url: String!
  stargazers_count: Int!
  open_issues_count: Int

  # Investigation to represent dates
  created_at: String!
}

# Uses exact field names from GitHub for simplicity
type User {
  login: String!
  avatar_url: String!
  html_url: String!
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
  score: Int!
  comments: [Comment]! # Paginated or not?
  commentCount: Int!
}

# To select the sort order of the feed
enum FeedType {
  HOT
  NEW
}

type Query {
  # For the home page, after arg is optional to get a new page of the feed
  # Pagination TBD( to be decided)

  feed(type: FeedType!, after: String): [Entry]

  # For the entry page
  entry(repoFullName: String!): Entry

  # To display the current user on the submission page, and the navbar
  currentUser: User
}

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

schema {
  query: Query
  mutation: Mutation
}
`;

export default [schema];
