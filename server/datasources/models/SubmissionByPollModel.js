module.exports = {
  table_name: 'submission_by_poll',
  fields: {
    submissionid: 'uuid',
    poll: 'uuid',
    choice: 'uuid',
    user: 'uuid',
    halfday: 'timestamp',
    ts: 'timestamp',
    metadata: {
      type: 'map',
      typeDef: '<text, text>'
    }
  },
  key: [['poll', 'halfday'], 'user']
};

/*
Idea:
add half-day to partition key. This will make partitions smaller.
However it will also allow a use to possibly vote twice.
Voting twice is bad but not the end of the world so to prevent double voting:

create another table with stricter (but not too strict) consistency:
user: id
poll: id
voted: boolean
partition: poll, user

Check this table everytime a voter submits. IF they already submitted and this
table is up to date due to the sweet-spot consistency then fail.
IF they already submitted IN THE LAST 12 HOURS and this
table is NOT up to date due to the consistency then they will just overwrite
their vote in this 12 hour (half day period)

Eventually the source of truth table boolean will update and prevent revoting
as it should.

To double vote a user would have to get lucky:
they would have to wait 12 hours to submit their second vote AND the source of
truth table would have to have not updated for 12 hours (lol)
*/
