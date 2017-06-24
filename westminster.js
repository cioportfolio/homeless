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
    var emailAddress = getField($, 'Email').html();
    var postAddress = getField($, 'Address').text();
    var whoHelp = getField($,'Who do we help').text();
    var notHelp = getField($,'Who we cannot help').text();

    var results = {
      serviceName: serviceName,
      url: url,
      phoneNumber: phoneNumber,
      emailAddress: emailAddress,
      postAddress: postAddress,
      whoHelp: whoHelp,
      notHelp: notHelp
    };

    return results;
  });
}



function getPage(p) {
  return getContent('http://www.homeless.org.uk/search-services?field_geofield_latlon=westminster&field_geofield_latlon_op=5&field_homeless_england_type=All&field_region_and_local_authority=All&field_homeless_england_type_1=All&page=' + p).then(function(data) {

    var $ = cheerio.load(data);

    var pageList = $('.listings li').length;

    resultCount+=pageList;
    $('.listings li h3').each(function( index ) {
      getRow('http://www.homeless.org.uk' + $( this ).children('a').attr('href')).then(function (data) {
/*          console.log('<p><a href="' + data.url + '">' + data.serviceName + '</a> Phone : ' + data.phoneNumber + ' Email : ' + data.emailAddress + ' Address : ' + data.postAddress);
          console.log('<p>Who do we help?');
          console.log('<p>' + data.whoHelp);
          console.log('<p>Who we cannot help');
          console.log('<p>' + data.notHelp); */         
        console.log('"' + data.serviceName + '","' + data.url + '","' + data.phoneNumber + '","' + data.emailAddress + '","' + data.postAddress + '","' + data.whoHelp + '","' + data.notHelp + '"');
      });
    });
    if ($('.pager-last').length > 0) {
      getPage(p+1);
    };
  }, function (err) {
    console.error(err);
  });
};

console.log('serviceName,url,phoneNumber,emailAddress,postAddress,whoHelp,notHelp');

getPage(0);

