var config = [{
		dimension: "cum14D",
		name: "Cumulative cases for 14 days per 100'000 inhabitants",
		y: "Cumulative cases per 100K"
	},
	{
		dimension: "cumulatedCases",
		name: "Cumulative cases",
		y: "Cumulative cases"
	},
	{
		dimension: "cumulatedDeaths",
		name: "Cumulative deaths",
		y: "Cumulative deaths"
	},
	{
		dimension: "cumulatedCasesBy1000",
		name: "Cumulative cases per 100'000 inhabitants",
		y: "Cumulative cases per 100K"


	},
	{
		dimension: "cumulatedDeathsBy1000",
		name: "Cumulative deaths per 100'000 inhabitants",
		y: "Cumulative deaths per 100K"
	},
	{
		dimension: "cumulatedCasesBycumulatedDeaths",
		name: "Cumulative deaths / Cumulative cases",
		y: "Ratio cumulative deaths / cases"

	},
	{
		dimension: "cases",
		name: "Number of cases reported per day",
		y: "Number of cases"

	},
	{
		dimension: "deaths",
		name: "Number of deaths reported per day",
		y: "Number of deaths"

	}
];

$("#query").change(function () {
	setURL();
	drawCurrentConfiguration();
});

var getUrlParameter = function getUrlParameter(sParam) {
	var sPageURL = window.location.search.substring(1),
		sURLVariables = sPageURL.split('&'),
		sParameterName,
		i;

	for (i = 0; i < sURLVariables.length; i++) {
		sParameterName = sURLVariables[i].split('=');

		if (sParameterName[0] === sParam) {
			return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
		}
	}
};

var query = getUrlParameter("q");
if (query) {
	$("#query").val(query)
}

function setURL() {
	if (history.pushState) {
		var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?q=' + $("#query").val();
		window.history.pushState({
			path: newurl
		}, '', newurl);
	}

}

function drawCurrentConfiguration() {
	$("#spinner").show()
	config.forEach(function (conf) {
		var dim = conf.dimension;
		var series = getSeriesFromData($("#continent").val(), dim);
		drawChart(series, conf);
	})
}

function round(number) {
	return parseInt(number * 1000) / 1000.0;
}

var data;
$.getJSON("ecdc.json", function (_data) {
	data = _data;
	Object.keys(_data).forEach(function (currentCountry) {
		cumulatedCases = 0;
		cumulatedDeaths = 0;
		_data[currentCountry].records.reverse().forEach(function (r) {
			if (r.cases != null && parseInt(r.cases) > 0) {
				cumulatedCases += parseInt(r.cases);
			}
			if (r.deaths != null && parseInt(r.deaths) > 0) {
				cumulatedDeaths += parseInt(r.deaths);
			}
			r.cumulatedCases = cumulatedCases;
			r.cumulatedDeaths = cumulatedDeaths;
			r.cumulatedDeathsBy1000 = round((cumulatedDeaths / parseInt(_data[currentCountry].pop2019 / 100000.0)));
			r.cumulatedCasesBy1000 = round((cumulatedCases / parseInt(_data[currentCountry].pop2019 / 100000.0)));
			r["cum14D"] = round(r["cum14D"]);
			if (cumulatedCases > 0) {
				r.cumulatedCasesBycumulatedDeaths = round(cumulatedDeaths / cumulatedCases);
			}

		})

	})
	drawCurrentConfiguration();
});


function getSeriesFromData(continent, dimension) {

	var countries = _.uniq(Object.keys(data));
	var x_series = [];
	var current_date = moment("2020-03-01");
	while (moment().add(1, "day").isAfter(current_date)) {
		x_series.push(current_date.add(1, "day").format("DD/MM/YYYY"));
	}

	function getDataFor(country, key) {

		var filter_query = $("#query").val();
		if (filter_query != null && filter_query.length > 1) {
			if (!country.toLowerCase().match(new RegExp(filter_query.toLowerCase().replace(/\W+/g, "|")))) {
				return null;
			}
		}

		var dataCountry1 = data[country].records;
		var pop_min = parseFloat($("#popMin").val()) * 1000000;
		var pop_max = parseFloat($("#popMax").val()) * 1000000;
		var pop_value = parseFloat(data[country].pop2019);
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
				if (d.date == xs) {
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
			color: getColorFromPalette(country),
			data: countrySeriesData
		}

		var min_value = parseFloat($("#min").val());
		var max_value = parseFloat($("#max").val());
		if (!min_value || !max_value) {
			return result;
		}

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


function drawChart(series, conf) {

	Highcharts.chart(conf.dimension, {
		rangeSelector: {
			selected: 1
		},
		chart: {
			zoomType: 'x'
		},
		title: {
			text: conf.name
		},
		xAxis: {
			type: 'datetime'
		},
		yAxis: {
			title: {
				text: conf.y
			}
		},

		legend: {
			align: 'center',
			verticalAlign: 'bottom',
			x: 0,
			y: 0
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