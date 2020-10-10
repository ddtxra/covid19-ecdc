'use strict';

const fs = require('fs');

let rawdata = fs.readFileSync('data.json');
let datapoints = JSON.parse(rawdata);

var countries = {};
datapoints.records.forEach(p => {
	if (!countries[p.countriesAndTerritories]) {
		countries[p.countriesAndTerritories] = {
			continent: p.continentExp,
			pop2019: p["popData2019"],
			records: []
		}
	}
	countries[p.countriesAndTerritories].records.push({
		date: p.dateRep,
		cases: p.cases,
		deaths: p.deaths,
		cum14D: p["Cumulative_number_for_14_days_of_COVID-19_cases_per_100000"]
	})
})

fs.writeFileSync('ecdc.json', JSON.stringify(countries));