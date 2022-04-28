# Library test

Library API to manage a library inventory with book checkout and return. 

Start by installing the dependencies.

```bash
$ npm install
```

## Stack
 
DynamoDB, TypeScript, Lambda, and Serverless Stack Toolkit.

### Constraints

- Users cannot checkout a book if they have an overdue book or
they have more than 3 checked out books 
- Default checkout duration is 2 weeks.

### Endpoints

- Librarian:
  - add a book to the library
  - remove a book from the library
  - retrieve list of overdue books
- User
  - checkout book
  - return book
  - retrieve the user's checked out books


## Deployment commands

### `npm run start`

Starts the local Lambda development environment.

### `npm run build`

Build your app and synthesize the stack.

Generates a `.build/` directory with the compiled files and a `.build/cdk.out/` directory with the synthesized CloudFormation stacks.

### `npm run deploy`

Deploy the stack to AWS.

### `npm run remove`

Remove the stack and all of its resources from AWS. 

