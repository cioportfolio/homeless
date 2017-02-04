const cheerio = require("cheerio");
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
    })
};

var resultCount=0;
var results = [];

function getPage(p) {
  getContent('http://beta.charitycommission.gov.uk/charity-search/?q=&onlyShow=Up-to-date&p=' + p + '&classification1=Accommodation/housing').then(function(data) {
    var $ = cheerio.load(data);
    var total = parseInt($('.result-count').text());
/*    console.log(total); */
    var pageList = $('.results-list li').length;
/*    console.log(pageList); */
    resultCount+=pageList;
    $('.results-list li').each(function( index ) {
/*      var charity = {charityId: parseInt($( this ).children('p').text()), charityName: $( this ).children('h3').text()};
      console.log( p + ' - ' + index + ": " + charity.charityId + ':' + charity.charityName);
      results.push(charity); */
      console.log('<a href="http://beta.charitycommission.gov.uk/charity-details/?regid=' + parseInt($( this ).children('p').text()) + '&subid=0" >' + $( this ).children('h3').text() + '</a>')
    });
    if (resultCount < total) {
      getPage(p+1);
    };
  }, function (err) {
    console.error(err);
  });
};

getPage(1);

