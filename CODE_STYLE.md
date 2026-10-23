# React Site Coding Style

Follow the shared JavaScript conventions in `../node-server/CODE_STYLE.md` for all JavaScript and JSX under `src/`. Keep the existing React component, page, webservice, and data layers. Put API endpoint paths in `webservices/endpoints.json`; combine each endpoint with the configured API base URL before calling `makeRequest()`.

## Readability

- Use four spaces for indentation, double quotes, and semicolons.
- Use the full, descriptive module name in `require`/`import` declarations. Do not shorten a module name to an alias such as `evaluationManager` becoming `manager`.
- Put function and control-flow opening braces on the next line.
- Format JSX across multiple lines so component props, children, conditions, and lists are easy to scan.
- Keep one statement per line and use descriptive names for state, props, handlers, and API functions.
- Keep presentation in components/pages, API requests in `services/`, and sample-only data in `data/`.

## JavaScript rules

- Do not use `try/catch`; handle asynchronous failures with Promise `.catch()`.
- Give every `if` an `else`. Add a short comment when an `else` intentionally does nothing.
- Give every `.then()` its own `.catch()`. Nest dependent Promise work inside the preceding `.then()`.
- Make each `.catch()` log a unique source/function/step message in application code and preserve useful record IDs.
- Keep dependent steps in top-to-bottom order rather than hiding workflow steps in shared helper calls.
- Keep secrets out of browser code. The React site calls Node APIs and must not contain service credentials or private tokens.
