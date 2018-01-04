module.exports = {

  choice: {
    id: 'uuid',
    name: 'text',
    tags: 'set<text>'
  },

  rules: {
    name: 'text',
    voting: 'text',
    tabulation: 'text',
    minselectable: 'int',
    maxselectable: 'int',
    advancing: 'int'
  },

  window: {
    open: 'text',
    stop: 'text',
    close: 'text'
  }

};
