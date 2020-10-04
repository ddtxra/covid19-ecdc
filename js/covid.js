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

$("#label").change(function () {
	drawCurrentConfiguration();
});

function drawCurrentConfiguration() {
	drawChart(getSeriesFromData($("#continent").val(), $("#dimension").val()));
}

var data;
$.getJSON("data.json", function (_data) {
	data = _data;
	drawChart(getSeriesFromData("World", "Cumulative_number_for_14_days_of_COVID-19_cases_per_100000"));
});


function getSeriesFromData(continent, dimension) {

	var countries_filtered_by_continent = (continent == "World") ? data.records : data.records.filter(r => r.continentExp == continent);
	var countries = _.uniq(countries_filtered_by_continent.map(d => d.countriesAndTerritories));
	var x_series = [];
	var current_date = moment("2020-03-01");
	while (moment().isAfter(current_date)) {
		x_series.push(current_date.add(1, "day").format("DD/MM/YYYY"));
	}

	function getDataFor(country, key) {

		var filter_label = $("#label").val();
		if (filter_label != null && filter_label.length > 1) {
			if (!country.toLowerCase().match(new RegExp(filter_label.replace(/\W+/g, "|")))) {
				return null;
			}
		}

		var dataCountry1 = data.records.filter(r => r.countriesAndTerritories == country);
		var countrySeriesData = [];
		x_series.forEach(function (xs) {
			var point = null;
			dataCountry1.forEach(function (d) {
				if (d.dateRep == xs) {
					point = parseInt(d[key])
				}
			})
			if (point != null && point >= 0)
				countrySeriesData.push({
					x: moment(xs, "DD/MM/YYYY").valueOf(),
					y: point
				})
		})

		var result = {
			name: country,
			data: countrySeriesData
		}

		var min_value = parseInt($("#min").val());
		var max_value = parseInt($("#max").val());
		var last_element = countrySeriesData[countrySeriesData.length - 1];
		if (!last_element) {
			console.log("Could not find country " + country)
			return null;
		}

		var last_value = parseInt(last_element.y);
		console.log(country);
		console.log(countrySeriesData)
		console.log(min_value, max_value, last_value);

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
	//var dimension = "cases";
	//var dimension = "deaths";

	countries.forEach(function (country) {
		var serie = getDataFor(country, dimension);
		if (serie !== null) {
			series.push(serie);
		}
	})
	console.log(series);

	return series;

}


function drawChart(series) {

	Highcharts.chart('container', {

		title: {
			text: 'COVID19 ECDC numbers'
		},
		xAxis: {

			type: 'datetime'
			/*,
						min: moment("2020-03-01").valueOf(),
						max: moment().valueOf()*/
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