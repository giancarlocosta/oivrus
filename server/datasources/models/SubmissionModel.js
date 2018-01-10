module.exports = {
  table_name: 'submission',
  key: ['id'],
  fields: {
    id: 'uuid',
    poll: 'uuid',
    choice: 'uuid',
    user: 'uuid',
    ts: 'timestamp',
    metadata: {
      type: 'map',
      typeDef: '<text, text>'
    }
  }
};
