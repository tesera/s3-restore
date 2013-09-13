#!/usr/bin/env node

var program = require('commander'),
    knox = require('knox'),
    rest = require('restler'),
    _ = require('underscore');


program
  .version('0.0.1')
  .option('-b, --bucket [value]', 'S3 Bucket')
  .option('-p, --prefix [value]', 'key prefix')
  .option('-u, --url [value]', 'RESTful API URL')
  .parse(process.argv);

var client = knox.createClient({
  key: process.env.AWS_KEY,
  secret: process.env.AWS_SECRET,
  bucket: program.bucket
});

console.log('Syncronizing bucket: ' + program.bucket + ' to ' + program.url + ' with the following key prefix ' + program.prefix);

client.list({prefix: program.prefix}, function (err, files) {
  _(files.Contents).each(function (file) {
    console.log('getting: ' + file.Key);
    client.get(file.Key).on('response', function (res) {
        res.setEncoding('utf8');
        res.on('data', function(chunk){
          console.log('uploading: ' + file.Key);
          var options = {
            data: chunk,
            headers: {'Content-type': 'application/json', 'Accept': 'application/json'}           
          }
          rest.post(program.url, options).on('complete', function(data, response) {
            if (response.statusCode == 200) {
              console.log('uploaded: ' + file.Key);
            } else {
              console.log('error uploading: ' + file.Key);
            }
          });
        });
    }).end();
  })
});
