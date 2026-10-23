# MyApp

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.1.7.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Backend API

The backend is in `../mocmac-api` and requires Node.js and a running MongoDB instance.

1. In a terminal, run `cd ../mocmac-api`.
2. Copy `.env.example` to `.env` and set a private `JWT_SECRET` and `ADMIN_PASSWORD`.
3. Run `npm install`.
4. Run `npm run seed` to load products from `my-app/public/data/product.json` and create the initial admin account if needed.
5. Run `npm run dev` to start the API at `http://localhost:3000`.

**Warning:** `npm run seed` deletes all existing product records before loading the JSON file. Start the Angular app separately from `my-app`; `npm start` configures its development proxy for `/api`.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
