var log = require('loglevel');

var helper = module.exports = {

	dataResponse: function (options, err, board) {
		if (err) {
			log.error(err.message || err);
			log.debug(err.stack);
			process.exit(1);
		}
		if (typeof options.format == 'undefined') {
			options.format = 'csv';
		}
		if (typeof this[options.format] !== 'function') {
			log.warn('Unknown format. Defaulting to csv.');
			options.format = 'csv';
		}

		this[options.format](board, options);
	},

	json: function (board, options) {
		var data = board.data;
		console.log(JSON.stringify(data, null, 2));
	},

	js: function (board, options) {
		var data = board.data;
		console.log(data);
	},

	csv: function (board, options) {

		function doCsv(data) {
			if (data instanceof Array) {
				for (var i = 0; i < data.length; i++) {
					doCsv(data[i]);
					if (data[i] instanceof Array) {
						console.log();
					} else if (i < data.length - 1) {
						process.stdout.write(options.delimiter || ', ');
					}
				}
			} else {
				var str = data.toString();
				if (/[\n,"]/.test(str)) {
					process.stdout.write('"' + str + '"');
				} else {
					process.stdout.write(str);
				}
			}
		}

		doCsv(board.data);
		console.log();
	},

	plot: function (board, options) {
		var data = board.data;
		var CliGraph = require("cli-graph");

		if (board.schema.length == 1 && board.schema[0] == 'number') {
			var MAX_HEIGHT = process.stdout.rows - 5;
			var MAX_WIDTH = process.stdout.columns / 2 - 1;
			if (data.length > MAX_WIDTH) {
				data = data.slice(data.length - MAX_WIDTH);
			}
			//Find the max, min, sum and mean;
			var max, min, mean, sum = 0;
			for (var i = 0; i < data.length; i++) {
				var x = data[i];
				if (typeof max == 'undefined' || x > max) {
					max = x;
				}
				if (typeof min == 'undefined' || x < min) {
					min = x;
				}
				sum += x;
			}
			mean = sum / data.length;

			var height, centerY;

			var scaler = MAX_HEIGHT / max;

			if (min > 0) {
				height = max * scaler + 2;
				centerY = height - 1;
			} else {
				height = max * scaler - min * scaler + 2;
				centerY = height + min * scaler - 1;
			}

			var g1 = new CliGraph({
				height: height,
				width: data.length,
				center: {
					x: 0,
					y: centerY
				}
			}).setFunction(function (x) {
				if (x < 0) return null;
				return data[x] * scaler;
			});
			console.log(g1.toString());
			console.log("Max=%d Min=%d Mean=%d Last=%d", max, min, mean.toFixed(2), data[data.length - 1]);
		} else {
			log.error('The board schema isn\'t supported for plotting at the moment.')
		}
	},

};