var info;
chrome.runtime.onMessage(function(message,sender,sendResponse){
  // When we get a message from the content script
  if(message.method == 'setInfo')
    info = message.info;
  // When we get a message from the popup
  else if(message.method == 'getInfo')
    sendResponse(info);
});
