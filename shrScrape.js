const cheerio = require("cheerio");
var argv = require('minimist')(process.argv.slice(2));
var postCode = argv._[0];

const getContent = function(url) {
  // return new pending promise
  return new Promise((resolve, reject) => {
    // select http or https module, depending on reqested url
    const lib = url.startsWith('https') ? require('https') : require('http');

    const request = lib.get(url, (response) => {
      // handle http errors
      if (response.statusCode < 200 || response.statusCode > 299) {
         reject(new Error('Failed to load page, status code: ' + response.statusCode));
       }
      // temporary data holder
      const body = [];
      // on every content chunk, push it to the data array
      response.on('data', (chunk) => body.push(chunk));
      // we are done, resolve promise with those joined chunks
      response.on('end', () => resolve(body.join('')));
    });
    // handle connection errors of the request
    request.on('error', (err) => reject(err))
    });
};

function getField(DOM, fieldName) {
  var $ = DOM;
  return $('.mainContent .row h4').filter(function(i, el) {
      // this === el 
      return $(this).text().toUpperCase().includes(fieldName.toUpperCase());
    }).next();
}

function getRow(url) {
  return getContent(url).then(function(data) {
    var $ = cheerio.load(data);
    var serviceName = $('.mainContent .row h1').text();
    var phoneNumber = getField($, 'Phone').text();
    var emailAddress = getField($, 'Email').text();
    var postTown = getField($, 'Address').contents().eq(-3).text();

    return {url: url, serviceName: serviceName, phoneNumber: phoneNumber, emailAddress: emailAddress, postTown: postTown};
  });
}

var getRates = getContent('https://lha-direct.voa.gov.uk/SearchResults.aspx?Postcode=' + encodeURIComponent(postCode) + '&LHACategory=0&Month=6&Year=2017&SearchPageParameters=true').then(function(data) {
    var $ = cheerio.load(data);
    var rateTotal = 0;
    var rateCount = $('.brma-rates dd').length;
    if (rateCount === 0) {
      return 0;
    }
    $('.brma-rates dd').each(function( index ) {
      console.log($( this ).text());
      rateTotal += parseFloat($( this ).text().match(/[\d\.]+/));
    });
    return rateTotal/rateCount;

  }, function (err) {
    console.error(err);
  });

getRates.then(function (data) {
  console.log('Average rate: ', data);
});