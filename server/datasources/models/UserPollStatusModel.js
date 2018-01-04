module.exports = {
  table_name: 'user_poll_status',
  fields: {
    user: 'uuid',
    poll: 'uuid',
    status: 'text'
  },
  key: ['user', 'poll']
};
