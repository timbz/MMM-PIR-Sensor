/*
* MMM-PIR-Sensor
*/

Module.register('MMM-PIR-Sensor',{

	requiresVersion: "2.1.0",

	defaults: {
		sensorPIN: 22,
		powerSavingDelay: 10
	},

	notificationReceived: function(notification, payload) {
		if (notification === "RADIO_PLAYING") {
			this.sendSocketNotification('POWER_SAVING', off);
		} else if (notification === "RADIO_STOPPED") {
			this.sendSocketNotification('POWER_SAVING', off);
		}
	},

	start: function() {
		this.sendSocketNotification('CONFIG', this.config);
		Log.info('Starting module: ' + this.name);
	}
});
