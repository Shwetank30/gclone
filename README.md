# GClone
Concept for an Apollo full-stack example app that demonstrates all of the important concepts

## Code patterns to demonstrate

1. Routes and data loading
1. Server side rendering and store hydration
1. Merging data from multiple backends/APIs
1. Authentication and basic security
1. Mutations - updating and inserting items
1. Developer tool integrations, like `eslint-plugin-graphql`
1. One place where there is reactivity/streaming data (nice to have)

As new patterns emerge in Apollo development, we should add them to this app.

## App concept

gclone- It will have functionality where users can view & vote on repos.

There are three views:

1. The home page feed, which is a ranked list of repositories
1. A page to submit a new repository
1. A repository page, with comments

Does it demonstrate all of the required features above?

- [x] Routes and data loading? Yes, it has multiple pages which require different data.
- [x] SSR/hydration? Yes, the front page should load fast.
- [x] Merging data? Yes, this will merge upvote and comment data from a local database with repository information from GitHub.
- [x] Auth and basic security? Yes, it will have GitHub login, and security so that people can only post comments when logged in, and everyone can only vote once per repo.
- [x] Mutations: Submitting a new repo, voting, and commenting.
- [x] Dev tools: Yes
- [x] Reactivity: we can reactively update the vote count on the repository page via a websocket or poll.

## Other tech

- React
- React router
- Webpack
- Babel
- Redux
- Passport for login


## Demo Installation
### 1. Node
Make sure you have Node v4.x.x installed (app has been tested with node v4.4.5)

### 2. Clone the app

```
> mkdir myGitHunt && cd $_
> git clone https://github.com/Shwetank30/gclone.git
> npm install
```

### 3. Run Migrations
Seed the application
```
> npm run migrate
> npm run seed
```


### 4. Setup Github OAuth App
- Under your Github profile dropdown, choose 'Settings'
- On the left nav, choose 'OAuth applications'
- Choose the 'Developer Applications' tab at the top of the page
- Click 'Register a new application' button
- Register your application like below
- Click 'Register application' button



On the following page, grab:
- Client ID
- Client Secret



### 5. Add Environment Variables
Set your Client ID and Client Secret Environment variables:

`> GITHUB_CLIENT_ID="your Client ID"; export GITHUB_CLIENT_ID`

`> GITHUB_CLIENT_SECRET="your Client Secret" export GITHUB_CLIENT_SECRET`


### 6. Run the app

`> npm  run start`

- Open the client at http://localhost:5200
- Click "Log in with GitHub" in the upper right corner
- You'll be presented with the seed items in the app



#### Submit a Repo
Click the green Submit button and add repo with the username/repo-name pattern.



#### New Item
Review the new item, up vote it and visit the repo via the link.   


#### Apollo Server
The server will run on port 3010. You can access the server's GraphiQL UI at http://localhost:3010/graphql
