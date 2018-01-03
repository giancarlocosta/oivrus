console.log('hi1');

var mockData = {
  1: { id: 'p1', name: 'Do you think Cardano will beat Eth?', choices: [{ id: 'c1.1', name: 'Yes' }, { id: 'c1.2', name: 'No' }, { id: 'c1.3', name: 'Maybe' }] },
  2: { id: 'p2', name: 'Which crypto is your favorite?', choices: [{ id: 'c2.1', name: 'XRP' }, { id: 'c2.2', name: 'ETH' }, { id: 'c2.3', name: 'ADA' }] },
  3: { id: 'p3', name: 'What crypto are you most confident in?', choices: [{ id: 'c3.1', name: 'XRP' }, { id: 'c3.2', name: 'ETH' }, { id: 'c3.3', name: 'ADA' }] },
  4: { id: 'p4', name: 'How much do you have invested?', choices: [{ id: 'c4.1', name: '> 100' }, { id: 'c4.2', name: '> 1000' }, { id: 'c4.3', name: '> 10000' }] }
};
/*
<form action="">
<input type="radio" name="gender" value="male"> Male<br>
<input type="radio" name="gender" value="female"> Female<br>
<input type="radio" name="gender" value="other"> Other
</form>
<button id="sub">Submit</button>
*/
document.addEventListener('DOMContentLoaded', function() {
  console.log('hi');

  //setInterval(function() {

    chrome.runtime.sendMessage({'action':'getInfo'}, function(response) {
      //response is now the info collected by the content script.
      if(response.info.polls) {
        createPolls(response.info.polls)
      }

    });

  //}, 3000)

}, false);

function getRemotePollById(id, callback) {
  var poll = mockData[id];
  callback(null, poll);
}

function addSubmitButtonListener(pollId, buttonId, divId) {
  var submitButton = document.getElementById(buttonId);
  console.log(submitButton);
  submitButton.addEventListener('click', function() {
    console.log('click');
    $("#"+divId).hide();
    chrome.runtime.sendMessage({'action':'markPollAsVoted', pollId: pollId});

    chrome.tabs.getSelected(null, function(tab) {
      d = document;

      var f = d.createElement('form');
      f.action = 'http://gtmetrix.com/analyze.html?bm';
      f.method = 'post';
      var i = d.createElement('input');
      i.type = 'hidden';
      i.name = 'url';
      i.value = tab.url;
      f.appendChild(i);
      d.body.appendChild(f);
      f.submit();
    });
  }, false);
}

function createPollDiv(poll) {
  const id = poll.id;
  const formId = id;
  const divId = 'pollContainer' + id;
  const submitButtonId = 'pollSubmit' + id;
  console.log(id);

  chrome.runtime.sendMessage({'action':'pollIsComplete', pollId: id}, function(response) {
    if (response && !response.pollIsComplete) {
      getRemotePollById(id, function(err, pollObj) {

        //append a new form element with id mySearch to <body>
        $('#pollsContainer').append('<div class="pollContainer" id="'+divId+'"></div>');
        $('#' + divId).append('<h2>'+pollObj.name+'</h2>');
        $('#' + divId).append('<form action="" id="'+formId+'"></form>');
        console.log(pollObj.choices);

        for (var i = 0; i < pollObj.choices.length; i++) {
          const p = pollObj.choices[i];
          $('#' + formId).append('<input type="radio" name="'+pollObj.id+'" value="'+p.name+'">'+p.name+'<br>');
          //console.log($(this).attr('id'))
        }
        $('#' + divId).append('<button id="'+submitButtonId+'">Submit</button>');
        addSubmitButtonListener(id, submitButtonId, divId);

      })
    } else {
      console.log('Poll Already voted on')
    }
  })
}

function createPolls(polls) {
  Object.keys(polls).forEach(function(key) {
    const poll = polls[key]
    createPollDiv(poll)
  });
}
