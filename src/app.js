/**
 * addon entry point
 * @params {object} e compose event object
*/
function showUI(e){
	var scheduleCard = buildScheduleCard(e);
  var userEmail = getUserEmail();
  console.log('app started by user ', userEmail);
  return [scheduleCard];
}

/**
 * get email address of current user as the identifier to communicate with backend via api if applicable (logic not implemented here)
*/
function getUserEmail(){
  var params = {
    headers: {
      "Authorization": "Bearer " + ScriptApp.getOAuthToken(),
      "Content-Type": "application/json",
    },
    muteHttpExceptions: true
  };
  var resp = UrlFetchApp.fetch("https://www.googleapis.com/gmail/v1/users/me/profile", params);
  if(resp.getResponseCode() === 200){
    var json = JSON.parse(resp.getContentText());
    return json.emailAddress;
  }
  else{
    console.error('Failed to get user email. resp code = ' + resp.getResponseCode() + 'message = ' + JSON.parse(resp.getContentText()));
    // add UI handler if needed;
    return null;
  }
}

/**
 * allow user to set schedule
 * default schedule date and time to 9am next day
 * @params {object} e compose event object
*/
function buildScheduleCard(e){
  var today = new Date().toLocaleDateString();
  var tomorrow = new Date(new Date(Date.parse(today) + 24*60*60*1000).toLocaleDateString());
  var tomorrow_m = tomorrow.getMonth()+1;
  var tomorrow_d = tomorrow.getDate();
  var tomorrow_y = tomorrow.getFullYear();
  // Create time dropdowns
  var monthDD = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.DROPDOWN)
    .setFieldName('month')
    .setTitle('MM')
  for(var i=1; i<13; i++){
    monthDD.addItem(i.toString(), i, i === parseInt(tomorrow_m));
  }
  var dateDD = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.DROPDOWN)
    .setFieldName('date')
    .setTitle('DD')
  for(var i=1; i<31; i++){
    dateDD.addItem(i.toString(), i, i === tomorrow_d);
  }
  var yearDD = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.DROPDOWN)
    .setFieldName('year')
    .setTitle('yyyy')
  // only allow select this year or next year for now
  yearDD
    .addItem(parseInt(tomorrow_y).toString(), parseInt(tomorrow_y), true)
    .addItem((parseInt(tomorrow_y)+1).toString(), parseInt(tomorrow_y)+1, false);
  // defaults to 9 AM
  var timeDD = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.DROPDOWN)
    .setFieldName('time')
    .setTitle('time')
  for(var i=1; i<13; i++){
    timeDD.addItem(i.toString(), i, i===9);
  }
  var apDD = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.DROPDOWN)
    .setFieldName('am_pm')
    .setTitle('am or pm')
    .addItem('AM', 'AM', true)
    .addItem('PM', 'PM', false);
  // add to section
  var section = CardService.newCardSection()
    .setHeader("<font><b>Pick a future time to send your email</b></font>")
    .addWidget(monthDD)
    .addWidget(dateDD)
    .addWidget(yearDD)
    .addWidget(timeDD)
    .addWidget(apDD);

  // create buttons
  var btnAction = CardService.newAction().setFunctionName('confirmSchedule');
  var btn = CardService.newTextButton()
    .setText("Confirm")
    .setOnClickAction(btnAction);
  var resetAction = CardService.newAction().setFunctionName('resetCard');
  var resetBtn = CardService.newTextButton()
    .setText("Reset")
    .setOnClickAction(resetAction);
  var btnGroup = CardService.newButtonSet()
    .addButton(resetBtn)
    .addButton(btn)
  // add to section
  section.addWidget(btnGroup);

  var card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle('Work-Life: email schedule')
      .setImageUrl('https://www.gstatic.com/images/icons/material/system/1x/label_googblue_48dp.png')
    )
    .addSection(section)
    .build();
  return card;	
}

/**
 * rebuild the search card
 * @params {object} e compose event object
*/
function resetCard(e){
  var navigation = CardService.newNavigation().updateCard(buildScheduleCard(e));
  return CardService.newActionResponseBuilder().setNavigation(navigation).build();
}

/**
 * @params {object} e compose event object
*/
function confirmSchedule(e){
	var month = e.formInput.month;
	var date = e.formInput.date;
	var year = e.formInput.year;
	var time = e.formInput.time;
	var am_pm = e.formInput.am_pm;
  // check if schedule is in the future
  var check = true;
  var nowTS = Date.parse(new Date().toLocaleString());
  var setting = parseInt(month) + '/' + parseInt(date) + '/' + parseInt(year) + ' ' + parseInt(time) + ':00 '+am_pm;
  var settingsDate = new Date(setting);
  var settingTS = Date.parse(settingsDate);
  if(settingTS < nowTS){
    check = false;
  }
  // render error UI if check failed
  if(!check){
    var errorMessage = 'Please select a future time.';
    return showErrorNoticeCard(e, errorMessage);
  }
	// create label
  var label = parseInt(month) + '/' + parseInt(date) + '/' + parseInt(year) + '/' + parseInt(time) +'/' + am_pm;
  label = 'WL:'+label;
	return addLabelToDraftMessage(e, label);
}

/**
 * @params {object} e: compose event object
 * @params {string} errorMessage: error message to be shown
*/
function showErrorNoticeCard(e, errorMessage){
  var errorMessage = CardService.newTextParagraph().setText("<font color='#f50525'>" + errorMessage + "</font>");
  var section = CardService.newCardSection()
    .setHeader("<font><b>Oops! Error</b></font>")
    .addWidget(errorMessage);
  var errorNoticeCard = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle('Work-Life MVP')
      .setImageUrl('https://www.gstatic.com/images/icons/material/system/1x/label_googblue_48dp.png')
    )
    .addSection(section)
    .build();
  var navigation = CardService.newNavigation().pushCard(errorNoticeCard);
  return CardService.newActionResponseBuilder().setNavigation(navigation).build();
}

/**
 * @params {object} e: compose event object
 * @params {string} successMessage
*/
function showSuccessNoticeCard(e, successMessage){
  var successMessage = CardService.newTextParagraph().setText("<font color='#f50525'>" + successMessage + "</font>");
  var section = CardService.newCardSection()
    .setHeader("<font><b>Operation succeeded</b></font>")
    .addWidget(successMessage);
  var errorNoticeCard = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle('Work-Life MVP')
      .setImageUrl('https://www.gstatic.com/images/icons/material/system/1x/label_googblue_48dp.png')
    )
    .addSection(section)
    .build();
  var navigation = CardService.newNavigation().pushCard(errorNoticeCard);
  return CardService.newActionResponseBuilder().setNavigation(navigation).build();
}


/**
 * add label to draft message.
 * note: cannot get current draft that user is working on directly, has to fetch all drafts and sort out.
 * @params {object} e: compose event object.
 * @params {string} label: label to be added.
*/
function addLabelToDraftMessage(e, label){
  // find current messageId user is looking at
  // Note - this can be error-prone!
  var messageId = findCurrentDraftMessageId(e);
  // in case of error, return error handler UI
  if(typeof messageId !== 'string'){
    return messageId;
  }

  // find all current labels and return id if name matches input
  var labelId = findLabelIdByName(label);
  if(typeof labelId !== 'string'){
    return labelId;
  }

  return attachLabelToMessage(e, labelId, messageId);
}

/**
 * !!!! need to decide logic !!!!!
 * @params {object} e: compose event object.
*/
function findCurrentDraftMessageId(e){
  var currMeta = e.draftMetadata;
  var query = {
    toRecipients: currMeta.toRecipients,
    bccRecipients: currMeta.bccRecipients,
    ccRecipients: currMeta.ccRecipients
  };
  // if current draft has not set subject nor toRecipients, prompt user error 
  if(query.toRecipients.length === 0){
    var errorMessage = 'Please input your email recipient before scheduling';
    return showErrorNoticeCard(e, errorMessage);
  }

  // find all drafts
  var allDrafts = GmailApp.getDrafts();
  var matches = [];
  // loop over all drafts and find the ones that matches the query (to, bcc, cc)
  for(var i=0; i<allDrafts.length; i++){
    var draft = allDrafts[i];
    var draftId = draft.getId();
    // cannot use draft.getMessage() directly because it needs accessToken which is not available in compose event object.
    var messageId = draft.getMessageId();
    var messageMeta = getMessageFromId(messageId);

    // start checking headers (recipients should match)
    var headerChecked = true;
    var messageHeaders = messageMeta.payload.headers;
    var messageSubject, messageTo=[], messageBcc=[], messageCc=[];
    for(var k=0; k<messageHeaders.length; k++){
      if(messageHeaders[k].name === 'Subject'){
        messageSubject = messageHeaders[k].value;
      }
      else if(messageHeaders[k].name === 'To'){
        messageTo = extractEmailFromValueStr(messageHeaders[k].value);
      }
      else if(messageHeaders[k].name === 'Bcc'){
        messageBcc = extractEmailFromValueStr(messageHeaders[k].value);
      }
      else if(messageHeaders[k].name === 'Cc'){
        messageCc = extractEmailFromValueStr(messageHeaders[k].value);
      }
    }

    if(!arraysEqual(messageTo, query.toRecipients)){
      headerChecked = false;
    }
    if(!arraysEqual(messageBcc, query.bccRecipients)){
      headerChecked = false;
    }
    if(!arraysEqual(messageCc, query.ccRecipients)){
      headerChecked = false;
    }

    // if header check failed, skip to next iteration. otherwise continue to check message creation time
    if(!headerChecked){
      continue;
    }
  
    // comparing timestamp
    // todo -- what's the expected behavior?


    var timestampChecked = true;
    var enableTimeCheck = true;
    var messageDate = messageMeta.internalDate*1000;
    if(enableTimeCheck){
      var nowTS = Date.parse(new Date(new Date().toLocaleString()));
      var gap = nowTS - messageDate;
      // set limit = 20 min, if the first draft is older than 10 min, then decide it's not the one user currently working on
      var limit = 20 * 60 * 1000;
      if(gap > limit){
        timestampChecked = false;
        console.error('draft is too old, not currently working on, exit early. messageDate = ', messageDate, new Date(messageDate), ', now = ', new Date().toLocaleString(), nowTS);
        var errorMessage = 'Cannot find recent draft matching the query: draft is too old, not currently working on, exit early.';
        return showErrorNoticeCard(e, errorMessage);
      }
    }

    if(timestampChecked){
      matches.push(messageId);
    }
  }
  var res = matches[0];
  console.log('findCurrentDraftMessageId returns messageId: ', res);
  return res;
}

function extractEmailFromValueStr(valStr){
  if(!valStr){
    return [];
  }
  var vList = valStr.split(',');
  var res = []
  for(var i=0; i<vList.length; i++){
    try{
      var temp = vList[i].split('<')[1];
      temp = temp.split('>')[0];
      res.push(temp);
    }
    catch(e){
      console.error(e);
    }
  }
  return res;
}

function arraysEqual(arr1, arr2){
  var res = true;
  if(arr1.length !== arr2.length){
    res = false;
  }
  arr1.sort();
  arr2.sort();
  for (var i = 0; i < arr1.length; ++i) {
    if (arr1[i] !== arr2[i]){
      res = false;
      break;
    }
  }
  return res;
}


/**
 * find labelId, or create new label and return the id
 * @params {string} label: name of the label
*/
function findLabelIdByName(label){
  // find all current labels and return id if name matches input
  var labelId;
  var currLabelListRequest = UrlFetchApp.fetch(
    "https://www.googleapis.com/gmail/v1/users/me/labels", 
    {
      headers: {
        "Authorization": "Bearer " + ScriptApp.getOAuthToken(),
        "Content-Type": "application/json",
      },
      muteHttpExceptions: true
    }
  );
  if(currLabelListRequest.getResponseCode() === 200){
    var currLabelList = JSON.parse(currLabelListRequest.getContentText()).labels;
    for(var i=0; i<currLabelList.length; i++){
      if(currLabelList[i].name == label){
        labelId = currLabelList[i].id;
        console.log('findLabelIdByName, label already exists, labelId = ', labelId);
        break;
      }
    }
  }
  else{
    console.error('failed to list labels.', currLabelListRequest.getResponseCode(), JSON.parse(currLabelListRequest.getContentText()));
    var errorMessage = 'An error occured in api request.';
    return showErrorNoticeCard(e, errorMessage);
  }

  // if not found in current list, create new label
  if(!labelId){
    var newLabel = UrlFetchApp.fetch(
    "https://www.googleapis.com/gmail/v1/users/me/labels", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + ScriptApp.getOAuthToken(),
        "Content-Type": "application/json",
      },
      // muteHttpExceptions so will always return even if not 200
      muteHttpExceptions: true,
      payload: JSON.stringify({'name': label})
    });

    if(newLabel.getResponseCode() === 200){
      labelId = JSON.parse(newLabel.getContentText()).id;
      console.log('findLabelIdByName, created new label, labelId = ', labelId);
    }
    else{
      console.error('failed to list labels.', newLabel.getResponseCode(), JSON.parse(newLabel.getContentText()));
      var errorMessage = 'An error occured in api request.';
      return showErrorNoticeCard(e, errorMessage);
    }
  }
  return labelId;
}


/**
 * @params {string} labelId
 * @params {string} messageId
*/
function attachLabelToMessage(e, labelId, messageId){
  console.log('to add label to message. labelId = ', labelId, ', messageId = ', messageId);
  var payload = {
    "addLabelIds": [labelId],
    "removeLabelIds": []
  };
  var messageModifyRequest = UrlFetchApp.fetch(
    "https://www.googleapis.com/gmail/v1/users/me/messages/" + messageId + "/modify", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + ScriptApp.getOAuthToken(),
        "Content-Type": "application/json",
      },
      // muteHttpExceptions so will always return even if not 200
      muteHttpExceptions: true,
      payload: JSON.stringify(payload)
    });
  if(messageModifyRequest.getResponseCode() === 200){
    console.log('Add label succeeded', JSON.parse(messageModifyRequest.getContentText()));
    var successMessage = "request succeeded!";
    return showSuccessNoticeCard(e, successMessage);
  }
  else{
    console.error('failed to add label to message.', messageModifyRequest.getResponseCode(), JSON.parse(messageModifyRequest.getContentText()));
    var errorMessage = 'An error occured in api request.';
    return showErrorNoticeCard(e, errorMessage);
  }
}


/**
 * find message metadata by Id.
 * metadata contains threadId, labelIds, id, internalDate, as well as payload.
 * @params {string} messageId: id of the message.
*/
function getMessageFromId(messageId){
  var params = {
    method:"get",
    contentType: "application/json",
    headers: {"Authorization": "Bearer " + ScriptApp.getOAuthToken()},
    muteHttpExceptions:true
  };
  var resp = UrlFetchApp.fetch("https://www.googleapis.com/gmail/v1/users/me/messages/"+messageId+"?format=metadata", params);
  var respContent = JSON.parse(resp.getContentText());
  if(resp.getResponseCode() === 200){
    return respContent;
  }
  else{
    console.error('getMessageFromId failed, message id = ', messageId, 'response = ', resp.getResponseCode(), respContent);
    var errorMessage = 'Sorry, an API error occurred: ' + respContent;
    return showErrorNoticeCard(e, errorMessage);
  }
}



