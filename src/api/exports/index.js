/* eslint linebreak-style: ["error", "windows"] */
const ExportsHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'exports',
  version: '1.0.0',
  register: async (server, { service, validator, playlistsService }) => {
    const exportsHanlder = new ExportsHandler(service, validator, playlistsService);
    server.route(routes(exportsHanlder));
  },
};
