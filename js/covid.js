$("#continent").change(function () {
	drawCurrentConfiguration();
});

$("#dimension").change(function () {
	drawCurrentConfiguration();
});

$("#min").change(function () {
	drawCurrentConfiguration();
});

$("#max").change(function () {
	drawCurrentConfiguration();
});

$("#popMin").change(function () {
	drawCurrentConfiguration();
});

$("#popMax").change(function () {
	drawCurrentConfiguration();
});


$("#label").change(function () {
	drawCurrentConfiguration();
});

function drawCurrentConfiguration() {
	$("#spinner").show()
	drawChart(getSeriesFromData($("#continent").val(), $("#dimension").val()));
}

function round(number) {
	return parseInt(number * 1000) / 1000.0;
}

var data;
$.getJSON("data.json", function (_data) {
	data = _data;
	var cumulatedCases = 0;
	var cumulatedDeaths = 0;
	var currentCountry = null;
	data.records.reverse().forEach(function (r) {

		if (currentCountry == null) {
			currentCountry = r.countriesAndTerritories;
		} else if (currentCountry !== r.countriesAndTerritories) {
			cumulatedCases = 0;
			cumulatedDeaths = 0;
			currentCountry = r.countriesAndTerritories;
		}

		if (r.cases != null && parseInt(r.cases) > 0) {
			cumulatedCases += parseInt(r.cases);
		}
		if (r.deaths != null && parseInt(r.deaths) > 0) {
			cumulatedDeaths += parseInt(r.deaths);
		}

		r.cumulatedCases = cumulatedCases;
		r.cumulatedDeaths = cumulatedDeaths;
		r.cumulatedDeathsBy1000 = round((cumulatedDeaths / parseInt(r.popData2019)) * 1000);
		r.cumulatedCasesBy1000 = round((cumulatedCases / parseInt(r.popData2019)) * 1000);
		r["Cumulative_number_for_14_days_of_COVID-19_cases_per_100000"] = round(r["Cumulative_number_for_14_days_of_COVID-19_cases_per_100000"]);
		if (cumulatedCases > 0) {
			r.cumulatedCasesBycumulatedDeaths = round(cumulatedDeaths / cumulatedCases);
		}


	})
	drawCurrentConfiguration();
});


function getSeriesFromData(continent, dimension) {

	var countries_filtered_by_continent = (continent == "World") ? data.records : data.records.filter(r => r.continentExp == continent);
	var countries = _.uniq(countries_filtered_by_continent.map(d => d.countriesAndTerritories));
	var x_series = [];
	var current_date = moment("2020-03-01");
	while (moment().add(1, "day").isAfter(current_date)) {
		x_series.push(current_date.add(1, "day").format("DD/MM/YYYY"));
	}

	function getDataFor(country, key) {

		var filter_label = $("#label").val();
		if (filter_label != null && filter_label.length > 1) {
			if (!country.toLowerCase().match(new RegExp(filter_label.toLowerCase().replace(/\W+/g, "|")))) {
				return null;
			}
		}

		var dataCountry1 = data.records.filter(r => r.countriesAndTerritories.toLowerCase() == country.toLowerCase());
		var pop_min = parseFloat($("#popMin").val()) * 1000000;
		var pop_max = parseFloat($("#popMax").val()) * 1000000;
		var pop_value = parseFloat(dataCountry1[0].popData2019);
		if (pop_min != 0 || pop_max != 0) {
			if (pop_value == null) return null;
			//no max, but a min
			if ((pop_max == 0 || !pop_max) && pop_min > 0 && pop_value < pop_min) {
				return null;
			}
			//no min, but a max
			if ((pop_min == 0 || !pop_min) && pop_max > 0 && pop_value > pop_max) {
				return null;
			}
			//max and min
			if ((pop_max > 0 && pop_value > pop_max) || (pop_min > 0 && pop_value < pop_min)) {
				return null;
			}
		}


		var countrySeriesData = [];
		x_series.forEach(function (xs) {
			var point = null;
			dataCountry1.forEach(function (d) {
				if (d.dateRep == xs) {
					point = parseFloat(d[key])
				}
			})
			if (point != null && point >= 0)
				countrySeriesData.push({
					x: moment(xs + " 12:00:00", "DD/MM/YYYY hh:mm:ss").valueOf(),
					y: point
				})
		})

		var result = {
			name: country,
			data: countrySeriesData
		}

		var min_value = parseFloat($("#min").val());
		var max_value = parseFloat($("#max").val());

		var last_element = countrySeriesData[countrySeriesData.length - 1];
		if (!last_element) {
			console.log("Could not find country " + country)
			return null;
		}

		var last_value = parseFloat(last_element.y);
		if (min_value == 0 && max_value == 0) {
			return result;
		} else {
			//no max, but a min
			if ((max_value == 0 || !max_value) && min_value > 0 && min_value < last_value) {
				return result;
			}
			//no min, but a max
			if ((min_value == 0 || !min_value) && max_value > 0 && max_value > last_value) {
				return result;
			}
			//max and min
			if ((max_value > 0 && max_value > last_value) && (min_value > 0 && min_value < last_value)) {
				return result;
			}

			return null;
		}
	}

	var series = [];
	countries.forEach(function (country) {
		var serie = getDataFor(country, dimension);
		if (serie !== null) {
			series.push(serie);
		}
	})
	return series;

}


function drawChart(series) {

	Highcharts.chart('chart', {
		rangeSelector: {
			selected: 1
		},
		chart: {
			zoomType: 'x'
		},
		title: {
			text: 'COVID19 ECDC numbers'
		},
		xAxis: {
			type: 'datetime'
		},
		yAxis: {
			//type: 'logarithmic',

			title: {
				text: 'Number of cases'
			}
		},

		legend: {
			layout: 'vertical',
			align: 'right',
			verticalAlign: 'middle'
		},

		plotOptions: {
			series: {
				label: {
					connectorAllowed: false
				}
			}
		},

		series: series,

		responsive: {
			rules: [{
				condition: {
					maxWidth: 500
				},
				chartOptions: {
					legend: {
						layout: 'horizontal',
						align: 'center',
						verticalAlign: 'bottom'
					}
				}
			}]
		}

	});

	$("#spinner").hide()

}




/*
	Highcharts.chart('container', {
		chart: {
			zoomType: 'x'
		},
		title: {
			text: 'USD to EUR exchange rate over time'
		},
		subtitle: {
			text: document.ontouchstart === undefined ?
				'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in'
		},
		xAxis: {
			type: 'datetime'
		},
		yAxis: {
			title: {
				text: 'Exchange rate'
			}
		},
		legend: {
			enabled: false
		},
		plotOptions: {
			area: {
				fillColor: {
					linearGradient: {
						x1: 0,
						y1: 0,
						x2: 0,
						y2: 1
					},
					stops: [
						[0, Highcharts.getOptions().colors[0]],
						[1, Highcharts.color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
					]
				},
				marker: {
					radius: 2
				},
				lineWidth: 1,
				states: {
					hover: {
						lineWidth: 1
					}
				},
				threshold: null
			}
		},

		series: [{
			type: 'area',
			name: 'USD to EUR',
			data: data
		}]
	});
*/