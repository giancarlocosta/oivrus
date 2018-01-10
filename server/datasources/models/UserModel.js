module.exports = {
  table_name: 'user',
  key: ['id'],
  indexes: ['fname', 'lname'],
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
  }
};
