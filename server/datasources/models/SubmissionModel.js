module.exports = {
  table_name: 'submission',
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
  },
  key: ['id']
};
