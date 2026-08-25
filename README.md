# webmail-client

## Getting started

Install [nvm](https://github.com/nvm-sh/nvm) (Node Version Manager):

    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

Restart your terminal, then install and use the required Node.js version:

    nvm install node
    nvm use node

Install dependencies:

    npm install

Start the development server:

    npm run dev

Enjoy!

## Where the data comes from

The client has no fixtures. It reads `/config.json` at boot to learn which
domain it is serving and where that domain's API is, then talks to
webmail-server for everything: `src/api/` holds the client, the wire types and
the adapters onto the UI types in `src/types.ts`, and `src/api/hooks.ts` is what
the components call.

`npm run dev` has no backend on its origin to answer `/config.json`, so it falls
back to a development config. Point it at a running server:

    VITE_API_BASE=http://localhost:8080/api/v1 VITE_DOMAIN=103mail.com npm run dev

Chat is live over a WebSocket rather than polled. `src/api/socket.ts` holds the
connection and `src/api/useChatSocket.ts` turns its frames into the state the
components already render. Connections terminate in a proxy rather than in the
API, which is invisible from here; see the server's ADR 13 and ADR 18.

For the full two-domain stack, see `../webmail-server/deploy/`.
