module.exports = {
  table_name: 'users_by_tag',
  key: [['tag'], 'user'],
  fields: {
    user: 'uuid',
    tag: 'text'
  }
};
