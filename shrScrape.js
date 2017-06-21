const cheerio = require("cheerio");
var argv = require('minimist')(process.argv.slice(2));
var postCode = argv._[0];

const getContent = function(url) {
  // return new pending promise
  return new Promise((resolve, reject) => {
    // select http or https module, depending on reqested url
    const lib = require('request');

    const request = lib(url, (err, response, body) => {
      // handle http errors
      if (err) {
         reject(err);
      }
      if (response.statusCode < 200 || response.statusCode > 299) {
         reject(new Error('Failed to load page, status code: ' + response.statusCode));
      }
      // temporary data holder
      resolve(body);
    });
  });
};

var getSHR = getContent('https://lha-direct.voa.gov.uk/SearchResults.aspx?Postcode=' + encodeURIComponent(postCode) + '&LHACategory=0&Month=6&Year=2017&SearchPageParameters=true').then(function(data) {
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
    return rateTotal/rateCount * 52 / 12;

  }, function (err) {
    console.error(err);
  });

var getRents = getContent('https://www.spareroom.co.uk/flatshare/search.pl?flatshare_type=offered&location_type=area&search=' + encodeURIComponent(postCode) + '&miles_from_max=0&showme_rooms=Y&showme_1beds=Y&showme_buddyup_properties=Y&searchtype=simple&editing=&mode=&nmsq_mode=&action=search&templateoveride=&show_results=&submit=').then(function(data) {
    var $ = cheerio.load(data);
    var rateTotal = 0;
    var rateCount = $('.listingPrice').length;
    if (rateCount === 0) {
      return 0;
    }
    $('.listingPrice').each(function( index ) {
      console.log($( this ).text());
      rateTotal += parseFloat($( this ).text().match(/[\d\.]+/));
    });
    return rateTotal/rateCount;

  }, function (err) {
    console.error(err);
  });

Promise.all([getRents, getSHR]).then(function (data) {
  console.log('Area: ' + postCode + ' Average SHR: ', data[1], ' pcm and average rents (SpareRoom): ', data[0], ' pcm');
});