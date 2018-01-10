(function () {

  var scriptName = "embed.js"; //name of this script, used to get reference to own tag
  var jQuery; //noconflict reference to jquery
  var jqueryPath = "http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js";
  var jqueryVersion = "1.11.1";
  var scriptTag; //reference to the html script tag

  /******** Get reference to self (scriptTag) *********/
  var allScripts = document.getElementsByTagName('script');
  var targetScripts = [];
  for (var i in allScripts) {
    var name = allScripts[i].src
    if(name && name.indexOf(scriptName) > 0)
    targetScripts.push(allScripts[i]);
  }

  scriptTag = targetScripts[targetScripts.length - 1];

  /******** helper function to load external scripts *********/
  function loadScript(src, onLoad) {
    var script_tag = document.createElement('script');
    script_tag.setAttribute("type", "text/javascript");
    script_tag.setAttribute("src", src);

    if (script_tag.readyState) {
      script_tag.onreadystatechange = function () {
        if (this.readyState == 'complete' || this.readyState == 'loaded') {
          onLoad();
        }
      };
    } else {
      script_tag.onload = onLoad;
    }
    (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(script_tag);
  }

  /******** helper function to load external css  *********/
  function loadCss(href) {
    var link_tag = document.createElement('link');
    link_tag.setAttribute("type", "text/css");
    link_tag.setAttribute("rel", "stylesheet");
    link_tag.setAttribute("href", href);
    (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(link_tag);
  }

  /******** load jquery into 'jQuery' variable then call main ********/
  if (window.jQuery === undefined || window.jQuery.fn.jquery !== jqueryVersion) {
    loadScript(jqueryPath, initjQuery);
  } else {
    initjQuery();
  }

  function initjQuery() {
    jQuery = window.jQuery.noConflict(true);
    main();
  }


  /******** starting point for your widget ********/
  function main() { //your widget code goes here

    jQuery(document).ready(function ($) {

      var socket = io('http://0.0.0.0:3000');
      socket.on('msg', function(msg){
        console.log('msg: ' + JSON.stringify(msg));
        if (msg.pollId) {
          const streamDivId = 'streamDivId' + msg.pollId;
          //const streamDivId = 'streamDivId' + 1;
          console.log('streamDivId: ' + streamDivId);
          $("#"+streamDivId).html(JSON.stringify(msg));
          setTimeout(function() {
            $("#"+streamDivId).html('...');
          }, 3000);
        }
      });

      var pollCache = {};
      var pollResultsCache = {};

      function scrapePolls() {
        var polls = {};
        $( ".survio_poll" ).each(function() {
          var id = $(this).attr('id');
          polls[id] = { id: id };
          //console.log($(this).attr('id'))
        });
        return polls;
      }

      function getPageInfo() {
        var pageInfo = {};
        pageInfo.pathname = window.location.pathname; // Path only
        pageInfo.url = window.location.href; // Full URL
        return pageInfo;
      }

      function stale(timestamp, timeout) {
        var to = timeout || 5;
        return (Date.now() - timestamp) / 1000 > to;
      }

      function getPollById(id, callback) {

        if (pollCache[id] && !stale(pollCache[id].lastUpdated)) {

          console.log('Getting Cached poll ' + id);
          callback(null, pollCache[id].poll);

        } else {
          console.log('Getting Server poll ' + id);
          $.ajax({
            url: 'http://127.0.0.1:3000/api/test/polls/' + id,
            success: function(data) {
              var poll = data.data;
              pollCache[id] = {
                lastUpdated: Date.now(),
                poll: poll
              };
              callback(null, poll)
            }
          })
          .fail(function(err) { callback(err); })

        }

      }

      function getPollResultsById(id, callback) {

        if (pollResultsCache[id] && !stale(pollResultsCache[id].lastUpdated)) {

          console.log('Getting Cached poll ' + id);
          callback(null, pollResultsCache[id].poll);

        } else {
          console.log('Getting Server poll ' + id);
          $.ajax({
            url: 'http://127.0.0.1:3000/api/test/polls/' + id + '/results',
            success: function(data) {
              var poll = data.data;
              pollResultsCache[id] = {
                lastUpdated: Date.now(),
                poll: poll
              };
              callback(null, poll)
            }
          })
          .fail(function(err) { callback(err); })

        }

      }

      function submitVote(pollId, userId, data, callback) {

        $.ajax({
          type: "POST",
          url: 'http://127.0.0.1:3000/api/test/polls/' + pollId + '/vote',
          data: JSON.stringify(data),
          contentType: "application/json; charset=utf-8",
          dataType: "json",
          success: function(d) { callback(null, d); },
          failure: function(errMsg) { callback(errMsg, null); }
        })
        .fail(function(response) { callback(response, null); });

      }

      function addSubmitButtonListener(pollId, buttonId, divId) {
        var submitButton = document.getElementById(buttonId);
        submitButton.addEventListener('click', function() {
          console.log('Clicked ' + submitButton);
          var pageInfo = getPageInfo()

          var selected = $("#"+divId+" input[type='radio']:checked");
          var selectedVal = selected.length > 0 ? selected.val() : null;

          if (!selectedVal) return;

          var userId = 'e9a6a03b-2b0f-4988-a39a-50694921e144';
          var data = {
            value: selectedVal,
            choice: 'f8d917a3-89db-49c1-863a-7762a554c588',
            user: userId,
            meta: {
              pageInfo
            }
          };

          submitVote(pollId, userId, data, function(err, res) {
            if (err) { return alert('Error: ' + response.responseText); }

            $("#"+buttonId).html('Vote Submitted!');
            $("#"+buttonId).prop("disabled",true);
            $(".radio-pick-"+pollId).hide();
          })

        }, false);
      }

      function updatePollResults(id) {
        setInterval(function() {
          console.log('Updating ' + id)
          getPollResultsById(id, function(err, pollResultsObj) {
            for (var i = 0; i < pollResultsObj.choices.length; i++) {
              const p = pollResultsObj.choices[i];
              const choiceResultDivId = 'choiceResultDiv' + p.id;
              $('#' + choiceResultDivId).html(p.votes);
            }
          });
        }, 5000)
      }

      function createPollContainer(poll) {
        const id = poll.id;
        const pollContainerId = 'pollContainer' + id;
        const formId = 'form' + id;
        const streamDivId = 'streamDivId' + id;
        const resultsDivId = 'resultsDiv' + id;
        const optionsDivId = 'optionsDiv' + id;
        const submitButtonId = 'pollSubmit' + id;

        const existingPolls = []
        $( ".pollContainer" ).each(function() {
          var id = $(this).attr('id');
          existingPolls.push(id)
          //console.log($(this).attr('id'))
        });

        getPollById(id, function(err, pollObj) {

          if (!existingPolls.includes(pollContainerId)) {

            //append a new form element with id mySearch to <body>
            $('#pollsContainer').append('<div class="pollContainer" id="'+pollContainerId+'"></div>');
            $('#' + pollContainerId).append('<h2>'+pollObj.name+'</h2>');
            $('#' + pollContainerId).append('<div class="streamContainer" id="'+streamDivId+'">...</div>');

            // Results Section
            $('#' + pollContainerId).append('<div class="resultsContainer" id="'+resultsDivId+'"></div>');
            $('#' + resultsDivId).html(JSON.stringify(pollObj.results));

            // Options Section
            $('#' + pollContainerId).append('<div class="optionsContainer" id="'+optionsDivId+'"></div>');
            $('#' + optionsDivId).append('<form action="" id="'+formId+'"></form>');
            // console.log(pollObj.choices);
            for (var i = 0; i < pollObj.choices.length; i++) {
              const p = pollObj.choices[i];

              const pickDivId = 'pickDiv' + p.id;
              const choiceResultDivId = 'choiceResultDiv' + p.id;
              $('#' + formId).append('<div class="pick" id="'+pickDivId+'"></div>');
              $('#' + pickDivId).append(p.name + ': ');
              $('#' + pickDivId).append('<div class="choice-result" id="'+choiceResultDivId+'">--</div>');
            }

            updatePollResults(id); // Async interval update of poll results

          }

          // Results Section
          console.log('Updating results')
          //$('#' + resultsDivId).html(JSON.stringify(pollObj.results.map(function(x) { var o = {}; o[x.name] = x.votes; return o; })));

        })

      }

      function createPollContainers(polls) {
        //$('#pollsContainer').length ? $('#pollsContainer') : $('<div id="pollsContainer"></div>').appendTo('body');
        for (let i = 0; i < polls.length; i++) {
          createPollContainer({ id: polls[i] }, function(err, data) {
            //console.log(JSON.stringify(data))
          });
        }
      }

      $('body').on('click', function(event) {
        // console.log('Click: ' + event.target)
        //$('#pollsContainer').append('Clicked<br/>');
      })

      function surv() {
        console.log('Surving');

        var polls = scrapePolls();
        //console.log('Polls: ' + JSON.stringify(polls));

        var pageInfo = getPageInfo();
        //console.log('Page info: ' + JSON.stringify(pageInfo));

        createPollContainers([
          '11111111-1111-1111-1111-111111111111',
          '22222222-2222-2222-2222-222222222222',
          '33333333-3333-3333-3333-333333333333',
          '44444444-4444-4444-4444-444444444444'
        ]);
      }

      surv();
      setInterval(function () {
        surv();
      }, 3000)

      //example jsonp call
      //var jsonp_url = "www.example.com/jsonpscript.js?callback=?";
      //$.getJSON(jsonp_url, function(result) { alert("win"); });

      //example load css
      loadCss("http://127.0.0.1:8887/survio-portal.css");

      //example script load
      // loadScript("http://code.jquery.com/jquery-1.11.1.min.js", function() { /* loaded */ });
      // loadScript("http://code.jquery.com/ui/1.11.1/jquery-ui.min.js", function() { /* loaded */ });

    });

  }

})();
