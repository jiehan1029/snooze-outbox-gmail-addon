Gmail Add-on & Gmail API exercise to schedule delayed email sending by label.

To link to a apps script project, create a `.clasp.json` file in local computer (do not commit), and then add the following to the file.
```
{"scriptId": <Script ID from your apps script project>}
``` 

To push to the linked apps script project, run `npm run deploy`.

You'll need to set the trigger manually in apps script project using function `sendDraftByLabel`.

To install the developer add-on directly, go to gmail -> Settings -> Add-ons -> check "Enable developer add-ons for my account" -> enter `AKfycbxyUxHyUpfhhz3RGjugmLfLhbrvEqZE_-4FxPzPrRk` in input field for "Developer add-ons" and click "install".

#### To optimize
* **find a better way to match draft**
* remove old WL label if user add new WL label
* verify it works on different timezones
* config user identifier for stackdriver log
* UI optimization: 1) show notice to user what would happen next; 2) refresh message after successfully added label (it may take a few seconds to a few minutes for label availabel to be shown, even though might receive request success code early.)

#### To extend
The add-on will collect current user's email, which can be used to query custom settings from an external API if that is set up.


