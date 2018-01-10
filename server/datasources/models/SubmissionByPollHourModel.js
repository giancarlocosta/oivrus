module.exports = {
  table_name: 'submission_by_poll_hour',
  key: [['poll', 'hour'], 'ts', 'user'],
  fields: {
    submissionid: 'uuid',
    poll: 'uuid',
    choice: 'uuid',
    user: 'uuid',
    hour: 'timestamp',
    ts: 'timestamp',
    metadata: {
      type: 'map',
      typeDef: '<text, text>'
    }
  }
};
