/* eslint-disable no-undef */
/* eslint-disable camelcase */
/* eslint linebreak-style: ["error", "windows"] */
/* eslint no-underscore-dangle: ["error", { "allowAfterThis": true }] */
const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const { mapPlayListToModel, mapSongToModel, mapPlayListActivityToModel } = require('../../utils');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');

class PlayListsService {
  constructor(collaborationService) {
    this._pool = new Pool();
    this._collaborationService = collaborationService;
  }

  async addPlayList({ name, credentialId: owner }) {
    const id = `playlist-${nanoid(16)}`;
    const createdAt = new Date().toISOString();

    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3, $4, $4) RETURNING id',
      values: [id, name, owner, createdAt],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Playlist gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getPlayLists(owner) {
    const query = {
      text: 'SELECT playlists.*, users.username FROM playlists LEFT JOIN users ON users.id = playlists.owner  LEFT JOIN collaborations ON collaborations.playlist_id = playlists.id WHERE playlists.owner = $1 OR collaborations.user_id = $1',
      values: [owner],
    };

    const result = await this._pool.query(query);

    return result.rows.map(mapPlayListToModel);
  }

  async deletePlayListById(id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }
  }

  async addPlayListSong({ id: playlist_id, songId: song_id, credentialId: owner }) {
    const id = `plalistsong-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlist_songs VALUES($1, $2, $3) RETURNING id',
      values: [id, playlist_id, song_id],
    };
    const result = await this._pool.query(query);
    if (!result.rows[0].id) {
      throw new InvariantError('Playlist song gagal ditambahkan');
    }
    await this.addPlayListSongActivity(playlist_id, song_id, owner, 'add');

    return result.rows[0].id;
  }

  async cekSongFound(id) {
    const query = {
      text: 'SELECT * FROM songs WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Song tidak ditemukan');
    }
  }

  async getPlayListSongs(id) {
    const query = {
      text: 'SELECT playlists.id, playlists.name, users.username FROM playlists LEFT JOIN users ON users.id = playlists.owner WHERE playlists.id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    return result.rows[0];
  }

  async multiplePlayListSongs(id) {
    const query = {
      text: 'SELECT songs.* FROM playlist_songs LEFT JOIN songs ON songs.id = playlist_songs.song_id WHERE playlist_songs.playlist_id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    return result.rows.map(mapSongToModel);
  }

  async deletePlayListSong(playlist_id, song_id, owner) {
    const query = {
      text: 'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
      values: [playlist_id, song_id],
    };
    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Playlist song tidak ditemukan');
    }
    await this.addPlayListSongActivity(playlist_id, song_id, owner, 'delete');
  }

  async addPlayListSongActivity(playlist_id, song_id, user_id, action) {
    const id = `playlistactivity-${nanoid(16)}`;
    const time = new Date().toISOString();

    const query = {
      text: 'INSERT INTO playlist_song_activities VALUES($1, $2, $3, $4, $5, $6) RETURNING id',
      values: [id, playlist_id, song_id, user_id, action, time],
    };

    const result = await this._pool.query(query);
    if (!result.rows[0].id) {
      throw new InvariantError('Playlist song activity gagal ditambahkan');
    }
  }

  async getPlayListActivities(id) {
    const query = {
      text: 'SELECT songs.*, users.username, playlist_song_activities.* FROM playlist_song_activities LEFT JOIN songs ON songs.id = playlist_song_activities.song_id LEFT JOIN users ON users.id = playlist_song_activities.user_id WHERE playlist_song_activities.playlist_id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    return result.rows.map(mapPlayListActivityToModel);
  }

  async verifyPlayListOwner(id, owner) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    const playlist = result.rows[0];

    if (playlist.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async verifyPlayListAccess(playlistId, userId) {
    try {
      await this.verifyPlayListOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      try {
        await this._collaborationService.verifyCollaborator(playlistId, userId);
      } catch {
        throw error;
      }
    }
  }
}

module.exports = PlayListsService;
