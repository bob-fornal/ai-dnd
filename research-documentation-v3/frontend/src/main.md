# main.ts (+ index.html)

Bootstraps the standalone Angular app. `index.html` is the host page.

## Responsibilities
- `main.ts`: `bootstrapApplication(AppComponent, appConfig)`.
- `index.html`: `<app-root>`, `<base href="/">`, and the Cinzel, Crimson Text, and Material Icons fonts from Google Fonts.

## Rules & gotchas
- The fonts are loaded here **and** again with `@import` in [styles.md](styles.md). Remove one copy when you touch either file.
- `favicon.ico` is referenced but `public/` doesn't contain one.

## Connections
**Parents (used by):**
- Angular CLI build (`angular.json`: `browser: src/main.ts`, `index: src/index.html`)

**Children (uses):**
- [app/app.config.md](app/app.config.md)
- [app/app.component.md](app/app.component.md)
