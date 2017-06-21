const cheerio = require("cheerio");
var Converter = require('csvtojson').Converter;

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

function getSHR(postcode) {
  return getContent('https://lha-direct.voa.gov.uk/SearchResults.aspx?Postcode=' + encodeURIComponent(postcode) + '&LHACategory=0&Month=6&Year=2017&SearchPageParameters=true').then(function(data) {
      var $ = cheerio.load(data);
      var rateTotal = 0;
      var rateCount = $('.brma-rates dd').length;
      if (rateCount === 0) {
        return 0;
      }
      $('.brma-rates dd').each(function( index ) {
        // console.log('SHR for :' + postcode + ' Field: ' + $( this ).text());
        rateTotal += parseFloat($( this ).text().match(/[\d\.]+/));
      });
      return Math.round(rateTotal/rateCount * 52 / 12 * 100)/100;

    }, function (err) {
      console.error(err);
    });
}

function getRents(postcode) {
  return getContent('https://www.spareroom.co.uk/flatshare/search.pl?flatshare_type=offered&location_type=area&search=' + encodeURIComponent(postcode) + '&miles_from_max=0&showme_rooms=Y&showme_1beds=Y&showme_buddyup_properties=Y&searchtype=simple&editing=&mode=&nmsq_mode=&action=search&templateoveride=&show_results=&submit=').then(function(data) {
      var $ = cheerio.load(data);
      var rateTotal = 0;
      var rateCount = $('.listingPrice').length;
      if (rateCount === 0) {
        return 0;
      }
      $('.listingPrice').each(function( index ) {
        // console.log('Rent for: ' + postcode + ' Field:' + $( this ).text());
        rateTotal += parseFloat($( this ).text().match(/[\d\.]+/));
      });
      return Math.round(rateTotal/rateCount * 100)/100;

    }, function (err) {
      console.error(err);
    });
}

function analyse(postcode) {
  return Promise.all([getRents(postcode), getSHR(postcode)]).then(function(data){
    return {postcode: postcode,
      SHR: data[1],
      Rent: data[0]
    };
  });
}

var converter = new Converter({});
rowPromises = [];

converter.on("end_parsed", function (jsonArray) {
   Promise.all(rowPromises).then(function(data) {
    endTable();
   });
});

converter.on("record_parsed", function(resultRow, rawRow, rowIndex) {
  // console.log('Getting data for '+resultRow.postcode);
  rowPromises.push(analyse(resultRow.postcode).then(function (data) {
    tableRow(data);
  }));
});

function startTable () {
  console.log('Postcode, Average SHR, Average Rent (SpareRoom)');
}

function tableRow (data) {
  console.log(data.postcode + ',' + data.SHR + ',' + data.Rent);
}

function endTable () {
  console.log("Postcodes file processed");
}

startTable();
require("fs").createReadStream("./ukpostcodes.csv").pipe(converter);