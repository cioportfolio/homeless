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
/* process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; */

function getPage(p) {
  return getContent('http://www.homeless.org.uk/homeless-england/search?search_api_views_fulltext=&field_homeless_link_member=All&page=' + p).then(function(data) {

    var $ = cheerio.load(data);

/*  Extract total responses from "Displaying 1 - 25 of 2146 services. Use the text search and keywords on the right to narrow this list." */

    var total = parseInt($('.view em').text().match(" of (.*) service")[1]);

    if (resultCount == 0) {
      console.log('<h1>Total number of services: ' + total + '</h1>');
    };

    var pageList = $('.listings li').length;
/*    console.log(pageList); */
    resultCount+=pageList;
    $('.listings li h3').each(function( index ) {
      console.log('<p><a href="http://www.homeless.org.uk' + $( this ).children('a').attr('href') + '">' + $( this ).text() + '</a>')
    });
    if (resultCount < total) {
      getPage(p+1);
    };
  }, function (err) {
    console.error(err);
  });
};

getPage(0);

