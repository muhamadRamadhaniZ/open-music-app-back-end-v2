/* eslint linebreak-style: ["error", "windows"] */
/* eslint no-underscore-dangle: ["error", { "allowAfterThis": true }] */
// eslint-disable-next-line import/no-extraneous-dependencies
const autoBind = require('auto-bind');

class PlayListHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    autoBind(this);
  }

  async addPlayListHandler(request, h) {
    this._validator.validatePlayListPayload(request.payload);
    const { name } = request.payload;
    const { id: credentialId } = request.auth.credentials;

    const playlistId = await this._service.addPlayList({ name, credentialId });

    const response = h.response({
      status: 'success',
      message: 'Playlist berhasil ditambahkan',
      data: {
        playlistId,
      },
    });

    response.code(201);
    return response;
  }

  async getPlayListsHandler(request) {
    const { id: credentialId } = request.auth.credentials;
    const playlists = await this._service.getPlayLists(credentialId);
    return {
      status: 'success',
      data: {
        playlists,
      },
    };
  }

  async deletePlayListHandler(request) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;
    await this._service.verifyPlayListOwner(id, credentialId);
    await this._service.deletePlayListById(id);
    return {
      status: 'success',
      message: 'Playlist berhasil dihapus',
    };
  }

  async addPlayListSongHandler(request, h) {
    await this._validator.validatePlayListSongPayload(request.payload);
    const { id } = request.params;
    const { songId } = request.payload;
    const { id: credentialId } = request.auth.credentials;
    await this._service.verifyPlayListAccess(id, credentialId);

    const playlistSongId = await this._service.addPlayListSong({ id, songId, credentialId });

    const response = h.response({
      status: 'success',
      message: 'Playlist Song berhasil ditambahkan',
      data: {
        playlistSongId,
      },
    });

    response.code(201);
    return response;
  }

  async getPlayListSongHandler(request) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;
    await this._service.verifyPlayListAccess(id, credentialId);
    const playlist = await this._service.getPlayListSongs(id);
    playlist.songs = await this._service.multiplePlayListSongs(id);
    return {
      status: 'success',
      data: {
        playlist,
      },
    };
  }

  async getPlayListActivitiesHandler(request) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;
    await this._service.verifyPlayListAccess(id, credentialId);
    const activities = await this._service.getPlayListActivities(id);
    return {
      status: 'success',
      data: {
        playlistId: id,
        activities,
      },
    };
  }

  async deletePlayListSongHandler(request) {
    await this._validator.validatePlayListSongPayload(request.payload);
    const { id } = request.params;
    const { songId } = request.payload;
    const { id: credentialId } = request.auth.credentials;

    await this._service.verifyPlayListAccess(id, credentialId);
    await this._service.deletePlayListSong(id, songId, credentialId);
    return {
      status: 'success',
      message: 'Playlist Song berhasil dihapus',
    };
  }
}

module.exports = PlayListHandler;
