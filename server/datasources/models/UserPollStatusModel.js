module.exports = {
  table_name: 'user_poll_status',
  key: ['user', 'poll'],
  fields: {
    user: 'uuid',
    poll: 'uuid',
    status: 'text'
  }
};
