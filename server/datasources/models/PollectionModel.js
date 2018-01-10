module.exports = {
  table_name: 'pollection',
  key: ['id'],
  indexes: ['name'],
  fields: {
    id: 'uuid',
    name: 'text',
    description: 'text',
    tags: {
      type: 'set',
      typeDef: '<text>'
    },
    polls: {
      type: 'set',
      typeDef: '<text>'
    },
    config: {
      type: 'map',
      typeDef: '<text, text>'
    }
  }
};
