// Configuring the AWS SDK
var AWS = require('aws-sdk');
AWS.config.update({ region: 'ap-south-1' });
const docClient = new AWS.DynamoDB.DocumentClient({
    region: 'ap-south-1'
});
exports.handler = (event, context, callback) => {

   console.log(event);
      const requestBody = JSON.stringify(event);



    // Define the object that will hold the data values returned
    var slotResults = {
        'isWinner': false,
        'score':0,
        'bet':event.bet,
        'points':0,
        'leftItem': {  item_id: { N: '' },
                            Value: { S: '' },
                            Category: { S: '' },
                            Image: { S: '' },
                            Name: { S: '' }
                    },
        'midItem': { item_id: { N: '' },
                     Value: { S: '' },
                     Category: { S: '' },
                     Image: { S: '' },
                     Name: { S: '' }   },
        'rightItem': { item_id: { N: '' },
                       Value: { S: '' },
                       Category: { S: '' },
                       Image: { S: '' },
                       Name: { S: '' }   }
                     };
    var params2 = {
                    TableName : "Attempts",
                    FilterExpression: "Username =:uname",
                     ExpressionAttributeValues: {
                     ":uname":{S:event.username}
                    }
            };
            var items=[]
            
     var request = new AWS.DynamoDB({ region: 'ap-south-1', apiVersion: '2012-08-10' });
      var xyz=request.scan(params2).promise().then(function(data){
        
      // console.log(data);
    // define parameters JSON for retrieving slot pull data from the database
        console.log("count is"+data.Count);
        var lastWinCount=lastWin(data);
        var count=data.Count;
        var min,max;
        if((count<=1) || ((count>5)&&(lastWinCount>=5))){
            min=1;
            max=3;
        }
        else{
            min=1;
            max=10;
        }
    var params = {
        TableName: 'Items',
        Key: {
            "item_id":{N:''},

        }
    }
    

    // create DynamoDB service object
        params.Key.item_id.N=getRandom(min,max).toString();
        var left=request.getItem(params).promise().then(function(data){
        return data.Item});
        
        params.Key.item_id.N=getRandom(min,max).toString();
        var right = request.getItem(params).promise().then(function(data){
        return data.Item});

        params.Key.item_id.N=getRandom(min,max).toString();
        var mid=request.getItem(params).promise().then(function(data){
        return data.Item});

        Promise.all([left,mid,right]).then(function(values) {
        slotResults.leftItem=values[0];
        slotResults.midItem=values[1];
        slotResults.rightItem=values[2];
        // if all three values are identical, the spin is a winner

        if ((slotResults.leftItem.Name.S ===slotResults.midItem.Name.S )&& (slotResults.leftItem.Name.S=== slotResults.rightItem.Name.S)) {
            slotResults.isWinner = true;
            slotResults.score=100;
         slotResults.points=parseInt(slotResults.leftItem.Value.N)+parseInt(slotResults.midItem.Value.N)+parseInt(slotResults.rightItem.Value.N);


        }
        else if((slotResults.leftItem.Name.S===slotResults.midItem.Name.S )|| (slotResults.leftItem.Name.S===slotResults.rightItem.Name.S)
        ||(slotResults.rightItem.Name.S ===slotResults.midItem.Name.S) ){
            slotResults.isWinner = false;
            slotResults.score=50;
            if(slotResults.leftItem.Name.N===slotResults.midItem.Name.N)
            {
               slotResults.points=parseInt(slotResults.leftItem.Value.N)+parseInt(slotResults.midItem.Value.N);
            }
            else
            if (slotResults.leftItem.Name.N===slotResults.rightItem.Name.N)
            {
              slotResults.points=parseInt(slotResults.leftItem.Value.N)+parseInt(slotResults.rightItem.Value.N);
            }
            else{

                slotResults.points=parseInt(slotResults.rightItem.Value.N)+parseInt(slotResults.midItem.Value.N);
            }


        }
        else
        {
            slotResults.isWinner = false;
            slotResults.score=0;

        }
        console.log(slotResults.points);
        slotResults.score=(slotResults.score+slotResults.points)*0.5*event.bet;
       if(event.username!="guest"){
         var dynamodb = new AWS.DynamoDB();
          docClient.scan({TableName : "Attempts"},function(err,data){
             console.log(data.Count);
             var id=parseInt(JSON.stringify(data.Count))+1;
              var paramsPut={
            Item: {
                    "Username": {S: event.username    }, 
                    "win": {BOOL:slotResults.isWinner}, 
                    "Score": {  N: JSON.stringify(slotResults.score)   },
                    "Id":{N:JSON.stringify(id)},
                    "attemptId":{N:JSON.stringify(count+1)}
                    }, 
                    TableName: "Attempts"
        };
              dynamodb.putItem(paramsPut, function(err, data) {
             if (err) console.log(err, err.stack); // an error occurred
                 else     console.log(data);           // successful response
         });
          });
       }        
        // return the JSON result to the caller of the Lambda function
        callback(null,slotResults);
    });

    });   // callback(null,slotResults );

};
function getRandom(min, max) {
    return Math.floor(Math.random() * max) + min;
}
function lastWin(data){
    
    var count=0;
  //  console.log(data.Items);
  //  var sortJsonArray = require('sort-json-array');
 
    data.Items.sort(function(obj1, obj2) {
	// Ascending: first age less than the previous
	return obj1.attemptId.N - obj2.attemptId.N;
});
    console.log(data.Items);
    data.Items.forEach(function(items) {
        // body...
       // console.log(items.attemptId.N);
        if(items.win.BOOL){
            count=0;
        }
        else{
            count=count+1;
         }
        
    });
    return count;
}