module.exports = {
  table_name: 'poll',
  fields: {
    id: 'uuid',
    name: 'text',
    description: 'text',
    tags: {
      type: 'set',
      typeDef: '<text>'
    },
    config: {
      type: 'map',
      typeDef: '<text, text>'
    },
    choices: {
      type: 'set',
      typeDef: '<frozen <choice>>'
    },
    rules: {
      type: 'frozen',
      typeDef: '<rules>'
    },
    windows: {
      type: 'set',
      typeDef: '<frozen <window>>'
    }
  },
  key: ['id'],
  indexes: ['name']
};
