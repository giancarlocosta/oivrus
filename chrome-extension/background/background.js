console.log("I am background.js");
var info;
var state;
var finishedPolls = {};

function markPollAsVoted(pollId) {
  finishedPolls[pollId] = true;
}

function pollIsComplete(pollId) {
  return finishedPolls[pollId];
}

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if(message.action == 'setInfo') {
    console.log( "setInfo" );
    info = message.info;
  }
  if (message.action == "getInfo") {
    sendResponse({ info: info });
  }
  if (message.action == "markPollAsVoted") {
    markPollAsVoted(message.pollId);
  }
  if (message.action == "pollIsComplete") {
    sendResponse({ pollIsComplete: pollIsComplete(message.pollId) });
  }
});
