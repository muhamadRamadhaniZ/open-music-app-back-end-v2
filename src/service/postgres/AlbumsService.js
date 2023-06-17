/* eslint-disable camelcase */
/* eslint linebreak-style: ["error", "windows"] */
/* eslint no-underscore-dangle: ["error", { "allowAfterThis": true }] */
const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const { mapDBToModel, mapSongToModel } = require('../../utils');

class AlbumsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addAlbum({ name, year }) {
    const id = `album-${nanoid(16)}`;
    const createdAt = new Date().toISOString();

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3, $4, $4, $5) RETURNING id',
      values: [id, name, year, createdAt, null],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getAlbumById(id) {
    const query = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Album tidak ditemukan');
    }

    return mapDBToModel(result.rows[0]);
  }

  async multipleSongByAlbumId(id) {
    const query = {
      text: 'SELECT * FROM songs WHERE "albumId" = $1',
      values: [id],
    };
    const result = await this._pool.query(query);

    return result.rows.map(mapSongToModel);
  }

  async editAlbumById(id, { name, year }) {
    const updatedAt = new Date().toISOString();
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2, updated_at = $3 WHERE id = $4 RETURNING id',
      values: [name, year, updatedAt, id],
    };
    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui Album, Id tidak ditemukan');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
    }
  }

  async addAlbumLike({ albumId, userId }) {
    const id = `album-${nanoid(16)}`;
    await this.albumExist(albumId);
    const query = {
      text: 'INSERT INTO user_album_likes VALUES($1, $2, $3) RETURNING id',
      values: [id, userId, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Menyukai album, gagal ditambahkan');
    }
    await this._cacheService.delete(`album:${albumId}`);
    return result.rows[0].id;
  }

  async albumExist(id) {
    const query = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Album tidak ditemukan');
    }
  }

  async deleteAlbumLike({ albumId, userId }) {
    const query = {
      text: 'DELETE FROM user_album_likes WHERE album_id = $1 AND user_id = $2 RETURNING id, album_id',
      values: [albumId, userId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Menyukai album gagal dihapus. Id tidak ditemukan');
    }

    const { album_id } = result.rows[0];
    await this._cacheService.delete(`album:${album_id}`);
  }

  async getAlbumLike(albumId) {
    try {
      // mendapatkan catatan dari cache
      const result = await this._cacheService.get(`album:${albumId}`);
      const likes = {
        likes: JSON.parse(result),
        cache: true,
      };
      return likes;
    } catch (error) {
      const query = {
        text: 'SELECT user_id FROM user_album_likes WHERE album_id = $1',
        values: [albumId],
      };
      const result = await this._pool.query(query);
      const likes = {
        likes: result.rowCount,
        cache: false,
      };

      await this._cacheService.set(`album:${albumId}`, JSON.stringify(result.rowCount));
      return likes;
    }
  }

  async verifyAlbumLike({ albumId, userId }) {
    const query = {
      text: 'SELECT * FROM user_album_likes WHERE album_id = $1 AND user_id = $2',
      values: [albumId, userId],
    };

    const result = await this._pool.query(query);
    if (result.rowCount) {
      throw new InvariantError('Sudah menyukai album');
    }
  }
}

module.exports = AlbumsService;
