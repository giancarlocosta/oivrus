module.exports = {
  table_name: 'tags_by_poll',
  key: [['poll'], 'tag'],
  fields: {
    poll: 'uuid',
    tag: 'text'
  }
};
