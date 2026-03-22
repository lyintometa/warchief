FROM node:25 AS build

COPY package.json package-lock.json /usr/src/

WORKDIR /usr/src/

RUN npm ci

COPY tsconfig.json /usr/src/
COPY src /usr/src/src

RUN npm run build
RUN npm prune --production

FROM node:25-alpine

COPY --from=build usr/src/package.json /usr/warchief/
COPY --from=build usr/src/dist /usr/warchief/dist
COPY --from=build usr/src/dist/data /usr/warchief/src/data
COPY --from=build usr/src/node_modules /usr/warchief/node_modules

CMD [ "node", "/usr/warchief/dist/index.js" ]