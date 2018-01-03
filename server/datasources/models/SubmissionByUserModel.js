module.exports = {
  table_name: 'submission_by_user',
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
  key: [['user'], 'timestamp', 'q_key']
};
