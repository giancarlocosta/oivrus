function getPolls() {
  const polls = {};
  $( ".survio_poll" ).each(function() {
    const id = $(this).attr('id');
    polls[id] = { id: id };
    //console.log($(this).attr('id'))
  });
  return polls;
}

setInterval(function() {

  $( document ).ready(function() {
  //$('body').on('click', '*', function(event) {
    console.log('ID of Parent element=' + $(this).parent().attr('id'));
    chrome.runtime.sendMessage({'action':'setInfo','info':{g:5}});
    const polls = getPolls();
    console.log(polls);
    chrome.runtime.sendMessage({'action':'setInfo','info':{polls: polls}});
    $.ajax({
      url: 'https://www.google.com/',
      //data: data,
      success: function(data) {
        $("p.result").text("Load was performed.");
        console.log("Load was performed.");
      }
    })
    .done(function() {
      console.log( "second success" );
    })
    .fail(function() {
      console.log( "error" );
    })
    .always(function() {
      console.log( "finished" );
    });
  });

}, 5000)


$('body').on('click', '*', function(event) {
  $("body").append('Clicked<br/>');
})
