# Architecture decisions

- Use an authenticated TanStack server route for streaming chat and typed server functions for one-shot AI tools, because each boundary matches its response contract while keeping credentials and data checks server-side.