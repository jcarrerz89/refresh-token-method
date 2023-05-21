import { getCookie, setCookie } from "typescript-cookie";

/**
 * Refresh session by triggering the refresh mutation and using the refresh token stored in the cookies
 * @returns Promise<string>
 */
const refreshSession = (): Promise<string> => {
    const refreshToken = getCookie("refresh-token");
    const address = `${process.env.REACT_APP_BFF}`;

    const request = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${refreshToken}`,
        },
        body: JSON.stringify({
            operationName: "refresh",
            query: `
                mutation refresh {
                    refresh {
                        accessToken,
                        refreshToken
                    }
                }`,
        }),
    };

    return fetch(address, request).then((response) => {
        if (response.ok) {
            return response
                .json()
                .then((refreshJSON) => {
                    /* Update tokens in cookies */
                    setCookie(
                        "jwt-auth-token",
                        refreshJSON.data.refresh.accessToken
                    );
                    setCookie(
                        "refresh-token",
                        refreshJSON.data.refresh.refreshToken
                    );

                    /* Return new auth token refetch failed request */
                    return refreshJSON.data.refresh.accessToken;
                })
                .catch(() => {
                    throw new Error("Unauthorized");
                });
        } else {
            throw new Error("Unauthorized");
        }
    });
};

const ApolloClientFetch = (
    uri: string,
    options: RequestInit
): Promise<Response> => {
    return fetch(uri, options)
        .then((response: Response) => {
            // Lazy promise? nees to be explicitelly requested
            return response.json();
        })
        .then((parsedResponse) => {
            /* if request failed due an authentication problem, we try to refresh the session and get new tokens */
            if (
                parsedResponse.errors &&
                parsedResponse.errors[0].message === "Unauthorized"
            ) {
                return refreshSession()
                    .then((accessToken) => {
                        let headers = {
                            ...options.headers,
                            authorization: `Bearer ${accessToken}`,
                        };

                        /* Refetch original request using the new auth token */
                        return fetch(uri, { ...options, headers: headers });
                    })
                    .catch((error) => {
                        // If refresh session fails, user must be logged out. TBD
                        throw error;
                    });
            } else {
                /* if the initial request went well, we repack the response into a new Response object */
                const content = JSON.stringify(parsedResponse);
                const options = {
                    status: 200,
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                    },
                };

                return new Response(content, options);
            }
        });
};

export default ApolloClientFetch;
