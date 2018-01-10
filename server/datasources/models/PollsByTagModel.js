/*
Use pollrank for sorting.
NOTE: Rank = num of voters on a poll. Update Rank as votes roll in
*/
module.exports = {
  table_name: 'polls_by_tag',
  key: [['tag'], 'poll'],
  fields: {
    poll: 'uuid',
    tag: 'text',
    pollrank: 'int'
  },
  materialized_views: {
    pollrank_by_tag: {
      select: ['poll', 'tag', 'pollrank'],
      key: [['tag'], 'poll', 'pollrank'],
      clustering_order: {"pollrank": "desc"}
    }
  }
};
