/*
Table for finding polls with a tag.
View is to list the most popular polls with the tag
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
      key: [['tag'], 'pollrank', 'poll'],
      clustering_order: {"pollrank": "desc"}
    }
  }
};
