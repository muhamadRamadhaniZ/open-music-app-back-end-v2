/* eslint linebreak-style: ["error", "windows"] */
/* eslint no-underscore-dangle: ["error", { "allowAfterThis": true }] */
const autoBind = require('auto-bind');

class ExportsHandler {
  constructor(service, validator, playlistsService) {
    this._playlistsService = playlistsService;
    this._service = service;
    this._validator = validator;
    autoBind(this);
  }

  async postExportPlaylistsHandler(request, h) {
    const { playlistId } = request.params;
    this._validator.validateExportPlaylistsPayload(request.payload);
    await this._playlistsService.verifyPlayListOwner(playlistId, request.auth.credentials.id);

    const message = {
      targetEmail: request.payload.targetEmail,
      playlistId,
    };

    await this._service.sendMessage('export:playlist', JSON.stringify(message));
    const response = h.response({
      status: 'success',
      message: 'Permintaan Anda sedang kami proses',
    });
    response.code(201);
    return response;
  }
}

module.exports = ExportsHandler;
