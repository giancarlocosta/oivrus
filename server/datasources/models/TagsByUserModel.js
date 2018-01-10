module.exports = {
  table_name: 'tags_by_user',
  key: [['user'], 'tag'],
  fields: {
    user: 'uuid',
    tag: 'text'
  }
};
