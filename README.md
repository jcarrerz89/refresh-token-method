# refresh-token-method
Function created to refresh a session of an expired authentication token, using the auth & refresh token method, in an Apolloclient + Graphql server context. Re-generates the authentication tokens when a graphql query fails due to an authorization error. 

- Use a refresh token to get new access tokens. 
- Update cookies
- Re-fetch initial request with new authorizacion token. 

Usage: 
```typescript

import ApolloClientFetch from "./fetch.apollo";

const ApolloClientInstance = new ApolloClient({
    cache: new InMemoryCache(),
    link: from([
        new HttpLink({
            uri: process.env.REACT_APP_BFF,
            fetch: ApolloClientFetch,
        }),
    ]),
});

```
