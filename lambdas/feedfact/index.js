'use strict';


const doc = require('dynamodb-doc');

const dynamo = new doc.DynamoDB();

function incr(x,coef) {
    var new_coef = {};
    new_coef.sum = coef.sum+x;
    new_coef.sumsq = coef.sumsq+(x*x);
    new_coef.samples = coef.samples+1;
    new_coef.avg = new_coef.sum/new_coef.samples;
    new_coef.std = Math.sqrt((new_coef.sumsq + (new_coef.avg*new_coef.avg)*new_coef.samples - (2*new_coef.avg*new_coef.sum))/new_coef.samples);
    return new_coef
}

function incr_rank(_in,_old) {
    var values = ['misconstrued','clickbait','cited','opinionated','informative'];
    values.forEach(function(v) {
        _old[v] = incr(_in[v].value,_old[v]);
    });
    return _old;
}
var initialRank ={
    "misconstrued" : {
        "sum" : 0,
        "sumsq" : 0,
        "samples" : 0
    },
    "clickbait" : {
        "sum" : 0,
        "sumsq" : 0,
        "samples" : 0
    },
    "opinionated" : {
        "sum" : 0,
        "sumsq" : 0,
        "samples" : 0
    },
    "cited" : {
        "sum" : 0,
        "sumsq" : 0,
        "samples" : 0
    },
    "informative" : {
        "sum" : 0,
        "sumsq" : 0,
        "samples" : 0
    }
}
/**
 *
 avg
 sample
 (avg * sample + new) / (sample +1)

 sum (x - avg)^2
 sum x^2 + avg^2 - 2*x*avg
 sum x^2 + x^2
 sum (sample*(avg^2))
 sum (

/**
 * Demonstrates a simple HTTP endpoint using API Gateway. You have full
 * access to the request and response payload, including headers and
 * status code.
 *
 * To scan a DynamoDB table, make a GET request with the TableName as a
 * query string parameter. To put, update, or delete an item, make a POST,
 * PUT, or DELETE request respectively, passing in the payload to the
 * DynamoDB API as a JSON body.
 */
exports.handler = (event, context, callback) => {
    //console.log('Received event:', JSON.stringify(event, null, 2));

    const doneget = (err, res) => {

      console.log("apikey||"+event.headers['x-api-key']+"||event||"+event.httpMethod+"||match||"+(res.Item ? 1 : 0)+"||title||"+event.queryStringParameters.title);
      callback(null, {
        statusCode: err ? '400' : '200',
        body: err ? err.message : JSON.stringify(res),
        headers: {
            'Content-Type': 'application/json',
        },
      });
    }

    const done = (err, res) => {
      callback(null, {
        statusCode: err ? '400' : '200',
        body: err ? err.message : JSON.stringify(res),
        headers: {
            'Content-Type': 'application/json',
        },
      });
    }

    switch (event.httpMethod) {
        case 'DELETE':
            dynamo.deleteItem(JSON.parse(event.body), done);
            break;
        case 'GET':
            dynamo.getItem({
                Key : {
                    "title": event.queryStringParameters.title
                },
                TableName: event.queryStringParameters.TableName
            }, doneget);
            break;
        case 'POST':
            var ranking = JSON.parse(event.body);
            ranking.Item.apikey = event.headers['x-api-key'];
            dynamo.putItem(ranking, function(){});
            dynamo.getItem({
               TableName: "Articles",
               Key :{ "title" : JSON.parse(event.body).Item.title}
            },
            function(err,res) {
                var body = JSON.parse(event.body);
                if (err) { done(err,res); }
                else if (res && res.Item && res.Item.title) {
                    //res.Item.rankings.a = incr(body.Item.ranking.a.value,res.Item.rankings.a);
                    res.Item.rankings = incr_rank(body.Item.ranking,res.Item.rankings);
                    dynamo.putItem({
                        TableName : "Articles",
                        "Item" : res.Item
                    },done);
                } else {
                    var rnk = incr_rank(body.Item.ranking,initialRank);
                    //var coef ={};
                    dynamo.putItem({
                        TableName : "Articles",
                        Item : {
                            "title" : body.Item.title,
                            "url" : body.Item.url,
                            "rankings" : rnk
                        }
                    },done);
                }
            });
            break;
        case 'PUT':
            dynamo.updateItem(JSON.parse(event.body), done);
            break;
        default:
            done(new Error(`Unsupported method "${event.httpMethod}"`));
    }
};
