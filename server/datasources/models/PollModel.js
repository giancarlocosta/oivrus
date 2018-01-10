module.exports = {
  table_name: 'poll',
  key: ['id'],
  indexes: ['name'],
  fields: {
    id: 'uuid',
    name: 'text',
    description: 'text',
    question: 'text',
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
  }
};

/*
{
  name: 'Crypto Poll',
  description: 'Measure crypto sentiment',
  question: 'Which crypto are you most confident will 10x in for 2018?',
  tags: ['crypto', 'sentiment', 'crypto-sentiment'],
  choices: [
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'BAT',
      value: 'BAT',
      tags: ['crypto', 'sentiment', 'crypto-sentiment']
    },
    {
      id: '11111111-1111-1111-1111-111111111112',
      name: 'FUN',
      value: 'FUN',
      tags: ['crypto', 'sentiment', 'crypto-sentiment']
    },
    {
      id: '11111111-1111-1111-1111-111111111113',
      name: 'ADA',
      value: 'ADA',
      tags: ['crypto', 'sentiment', 'crypto-sentiment']
    }
  ],
  rules: {
    voting: 'simple',
    tabulation: 'majority',
    minselectable: 1,
    maxselectable: 1
  },
  windows: [
    {
      open: '2018-01-07T22:48:08.275Z',
      close: '2020-01-07T22:48:08.275Z'
    }
  ],
  config: {
    selection: 'select',
    multivote: 'false'
  }
}
*/
