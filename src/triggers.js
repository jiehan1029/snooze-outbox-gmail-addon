// create time-driven trigger on apps script dashboard using the following function
function sendDraftByLabel(e){
  // list all drafts
  var allDraft = GmailApp.getDrafts();
  console.log('about to loop over all drafts, ', allDraft.length, ' found.');
  // loop and find labels for each
  for(var i=0; i<allDraft.length; i++){
    var draft = allDraft[i];
    // only thread has label
    var messageId = draft.getMessageId();
    var message = getMessageFromId(messageId);
    var labelIds = message.labelIds || [];
    var labels = [];
    for(var k=0; k<labelIds.length; k++){
      if(getLabelFromId(labelIds[k])){
        labels.push(getLabelFromId(labelIds[k]));
      }
    }
    for(var j=0; j<labels.length; j++){
      var name = labels[j].name;
      if(typeof name !== 'string'){
        continue;
      }
      if(name.substring(0,3) === 'WL:'){
        // label name format should be 'WL:m/d/y/t/am_pm'
        // compare with current time to see if should send
        try{
          var mon = parseInt(name.split(':')[1].split('/')[0]);
          var date = parseInt(name.split(':')[1].split('/')[1]);
          var yr = parseInt(name.split(':')[1].split('/')[2]);
          // note, current setting only allow integer time, may change in the future
          var time = parseInt(name.split(':')[1].split('/')[3]);
          var am_pm = name.split(':')[1].split('/')[4];


          // to-do
          // may need to consider timezone

          var now = new Date();
          console.log('for message ', messageId, ', label: ', name, ', now time: ', now, ', time string extracted from label name: ', mon, date, yr, time, am_pm);

          var nowYr = now.getFullYear();
          if(nowYr !== yr){
            continue;
          }
          var nowMonth = now.getMonth()+1;
          if(nowMonth !== mon){
            continue;
          }
          var nowDate = now.getDate();
          if(nowDate !== date){
            continue;
          }
          var nowTimeStr = now.toLocaleTimeString(); // "12:08:07 PM"
          console.log('date validated, to validate time am or pm...', nowTimeStr.split(' ')[1].toLowerCase(), am_pm.toLowerCase());
          if(nowTimeStr.split(' ')[1].toLowerCase() !== am_pm.toLowerCase()){
            continue;
          }
          console.log('am or pm validated, to validate time...', parseInt(nowTimeStr.split(' ')[0].split(':')[0]), time);
          if(parseInt(nowTimeStr.split(' ')[0].split(':')[0]) >= time){
            // send draft
            // cannot do draft.send(), missing accessToken
            var draftId = draft.getId();
            sendDraftById(draftId);
            // break out label loop
            break;
          }
        }
        catch(e){
          console.log(e);
          continue;
        }
      }
      else{
        continue;
      }
    }
  }
}

function sendDraftById(draftId){
  console.log('about to sendDraftById: ', draftId);
  var params = {
    method: "post",
    contentType: "application/json",
    headers: {"Authorization": "Bearer " + ScriptApp.getOAuthToken()},
    muteHttpExceptions: true,
    payload: JSON.stringify({ "id": draftId })
  };
  var resp = UrlFetchApp.fetch("https://www.googleapis.com/gmail/v1/users/me/drafts/send", params);
  if(resp.getResponseCode()===200){
    console.log('succeeded to sendDraftById. ', resp.getResponseCode(), JSON.parse(resp.getContentText()));
  }
  else{
    console.error('failed to sendDraftById. ', resp.getResponseCode(), JSON.parse(resp.getContentText()));
  }
}

function getLabelFromId(labelId){
  var params = {
    method: "get",
    contentType: "application/json",
    headers: {"Authorization": "Bearer " + ScriptApp.getOAuthToken()},
    muteHttpExceptions: true 
  }
  var resp = UrlFetchApp.fetch("https://www.googleapis.com/gmail/v1/users/me/labels/"+labelId, params);
  if(resp.getResponseCode() === 200){
    return JSON.parse(resp.getContentText());
  }
  else{
    console.error('failed to getLabelFromId, labelId = ', labelId, '. resp = ', resp.getResponseCode(), JSON.parse(resp.getContentText()));
    return null;
  }
}