module.exports = {
  table_name: 'user',
  fields: {
    id: 'uuid',
    fname: 'text',
    lname: 'text',
    age: 'int',
    dob: 'timestamp',
    tags: {
      type: 'set',
      typeDef: '<text>'
    }
  },
  key: ['id'],
  indexes: ['fname', 'lname']
};
