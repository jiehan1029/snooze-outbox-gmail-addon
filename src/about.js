/**
 * universal action trigger
 * @params {object} e compose event object
*/
function showAbout(e){
	var aboutCard = buildAboutCard(e);
  return [aboutCard];
}

function buildAboutCard(e){
  var tp = CardService.newTextParagraph()
    .setText("This is a placeholder for about card!");
  var section = CardService.newCardSection()
    .addWidget(tp);
  var card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle('About')
      .setImageUrl('https://www.gstatic.com/images/icons/material/system/1x/label_googblue_48dp.png')
    )
    .addSection(section)
    .build();
  return card;
}