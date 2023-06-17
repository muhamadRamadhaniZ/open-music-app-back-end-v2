/* eslint linebreak-style: ["error", "windows"] */
const UploadsCoverHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'uploads',
  version: '1.0.0',
  register: async (server, { service, validator }) => {
    const uploadsCoverHandler = new UploadsCoverHandler(service, validator);
    server.route(routes(uploadsCoverHandler));
  },
};
