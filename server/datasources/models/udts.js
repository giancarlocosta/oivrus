module.exports = {

  choice: {
    id: 'uuid',
    name: 'text',
    tags: 'set<text>'
  },

  rules: {
    voting: 'text',
    tabulation: 'text',
    minselectable: 'int',
    maxselectable: 'int',
  },

  window: {
    open: 'text',
    stop: 'text'
  }

};
