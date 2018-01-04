module.exports = {
  table_name: 'submission_by_user',
  fields: {
    submissionid: 'uuid',
    poll: 'uuid',
    choice: 'uuid',
    user: 'uuid',
    ts: 'timestamp',
    metadata: {
      type: 'map',
      typeDef: '<text, text>'
    }
  },
  key: [['user'], 'poll']
};
