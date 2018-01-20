AWS.config.update({ region: 'ap-south-1' });
AWS.config.credentials = new AWS.CognitoIdentityCredentials({ IdentityPoolId: 'ap-south-1:6da206cf-c22a-47ba-962e-50b37ecb923c' });
AWS.config.credentials.get(function(err) {
  if (err) console.log(err);
  else console.log(AWS.config.credentials);
});
var pullReturned = null;
var slotResults;
var isSpinning = false;

// Prepare to call Lambda function
var lambda = new AWS.Lambda({ region: 'ap-south-1', apiVersion: '2015-03-31' });


  //  betText=JSON.stringify(betJSON);


function pullHandle() {
    if (isSpinning == false) {
        // Show the handle pulled down
      //  slot_handle.src = "lever-dn.png";
    }
}

function initiatePull() {
    // Show the handle flipping back up
 //   slot_handle.src = "lever-up.png";
    // Set all three wheels "spinning"
  //  slot_L.src = "slotpullanimation.gif";
    //slot_M.src = "slotpullanimation.gif";
    //slot_R.src = "slotpullanimation.gif";
    // Set app status to spinning
    isSpinning = true;
    var isLoggedIn=false;
    var bet=$('#bet').val();
    if(!isLoggedIn){
      var username="guest";
    }
    else{
      var username="";
    }

    console.log("bet"+bet);
    var pullParams = {
    FunctionName: 'slotPull',
    InvocationType: 'RequestResponse',
    LogType: 'None',
    Payload:JSON.stringify({
      'bet':bet,
      'username':username,
    })
};
    // Call the Lambda function to collect the spin results
    lambda.invoke(pullParams, function (err, data) {
        if (err) {
            prompt(err);
        } else {
            pullResults = JSON.parse(data.Payload);
            console.log(pullResults);
          //  console.log(pullResults.leftItem.Image.S);
            console.log(pullResults.score);
            console.log(pullResults.bet);
            displayPull();
        }
    });
}

function displayPull() {
    isSpinning = false;
    if (pullResults.isWinner) {
        $("#message").text("Yayyy!! you won");
    }
    else if(pullResults.score>0){
      $("#message").text("Not bad. Keep trying");
    }
    if(pullResults.score==0){
      $("#message").text("Oops!! try again.");
    }
    //  console.log(pullResults.leftItem.Image.S);
      $('#score').text(pullResults.score);
      $("#L_img").delay(4000).attr("src", pullResults.leftItem.Image.S);
    $("#M_img").delay(6500).attr("src", pullResults.midItem.Image.S);
    $("#R_img").delay(9000).attr("src", pullResults.rightItem.Image.S);
}
