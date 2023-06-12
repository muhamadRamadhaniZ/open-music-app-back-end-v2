/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('playlist_songs', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    playlist_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    song_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
  });
  // memberikan constaint foreign key pada song_id terhadap kolom id dari tabel songs
  pgm.addConstraint('playlist_songs', 'fk_playlist_songs.song_id_playlists.id', 'FOREIGN KEY(song_id) REFERENCES songs(id) ON DELETE CASCADE');
  // memberikan constaint foreign key pada playlist_id terhadap kolom id dari tabel playlist
  pgm.addConstraint('playlist_songs', 'fk_playlist_songs.playlist_id_playlists.id', 'FOREIGN KEY(playlist_id) REFERENCES playlists(id) ON DELETE CASCADE');
};

exports.down = (pgm) => {
  pgm.dropConstraint('playlist_songs', 'fk_playlist_songs.song_id_playlists.id');
  pgm.dropConstraint('playlist_songs', 'fk_playlist_songs.playlist_id_playlists.id');
  pgm.dropTable('playlist_songs');
};
