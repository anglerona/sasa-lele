// Utility to make authenticated API requests with automatic token refresh
// Assumes refresh token is stored in localStorage and access token in memory or localStorage

export async function fetchWithAuth(url: string, options: RequestInit = {}, getTokens: () => { access: string, refresh: string }, setTokens: (tokens: { access: string, refresh: string }) => void, apiBase: string): Promise<Response> {
  let { access, refresh } = getTokens();
  let res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${access}`,
    },
  });

  if (res.status === 401 && refresh) {
    // Try to refresh the access token
    const refreshRes = await fetch(`${apiBase}/api/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (refreshRes.ok) {
      const data = await refreshRes.json();
      setTokens({ access: data.access, refresh });
      // Retry original request with new access token
      res = await fetch(url, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${data.access}`,
        },
      });
    } else {
      // Refresh failed, force logout or handle as needed
      throw new Error("Session expired. Please log in again.");
    }
  }
  return res;
}
