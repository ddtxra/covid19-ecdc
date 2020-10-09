'use strict';

const fs = require('fs');

let rawdata = fs.readFileSync('data.json');
let datapoints = JSON.parse(rawdata);

var records = datapoints.records.map(p => {
	return {
		date: p.dateRep,
		cases: p.cases,
		deaths: p.deaths,
		country: p.countriesAndTerritories,
		continent: p.continentExp,
		pop2019: p["popData2019"],
		cum14D: p["Cumulative_number_for_14_days_of_COVID-19_cases_per_100000"]
	}
})

let data = JSON.stringify({
	"records": records
});
fs.writeFileSync('ecdc.json', data);