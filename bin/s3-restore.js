#!/usr/bin/env node

var program = require('commander'),
    async = require('async'),
    request = require('request'),
    _ = require('underscore'),
    AWS = require('aws-sdk'),
    s3 = new AWS.S3();


program
  .version('0.0.1')
  .option('-b, --bucket [value]', 'S3 Bucket')
  .option('-p, --prefix [value]', 'key prefix')
  .option('-u, --url [value]', 'endpoint URL')
  .parse(process.argv);

console.log('Restoring bucket: ' + program.bucket + ' to ' + program.url + ' with key prefix ' + program.prefix);

var options = {
  Bucket: program.bucket
};
if(typeof program.prefix !== 'undefined') options.Prefix = program.prefix;

s3.listObjects(options, function (err, objects) {
  if(err) console.log(err);
  console.log('restoring: ' + objects.Contents.length + ' objects');

  var sorted = _(objects.Contents).sortBy(function (c) { return c.LastModified.getTime(); });

  async.eachSeries(sorted, function (object, callback) {
    console.log('getting: ' + object.Key);

    s3.getObject({Bucket: program.bucket, Key: object.Key}, function (err, data) {
      console.log('got: ' + object.Key);

      var options = {
        url: program.url,
        body: data.Body.toString(),
        headers: {'Content-type': 'application/json', 'Accept': 'application/json'}
      };

      request.post(options, function(data, response) {
          if (response.statusCode == 200) {
            console.log('uploaded: ' + object.Key);
          } else {
            console.log('error uploading: ' + object.Key);
          }
          callback(null);
      });

    });

  }, function (err) {
    console.log('restore successful');
  });

});
