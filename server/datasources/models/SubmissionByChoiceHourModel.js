module.exports = {
  table_name: 'submission_by_choice_hour',
  key: [['choice', 'hour'], 'ts', 'user'],
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
