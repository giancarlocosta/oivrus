module.exports = {
  table_name: 'submission_by_hour',
  fields: {
    id: 'uuid',
    q_key: 'uuid',
    q_value: 'text',
    hour: 'int',
    user: 'uuid',
    timestamp: 'timestamp',
    metadata: {
      type: 'map',
      typeDef: '<text, text>'
    }
  },
  key: [['q_key', 'hour'], 'timestamp', 'user']
};
