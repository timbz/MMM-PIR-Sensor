'use strict';

const NodeHelper = require('node_helper');
const Gpio = require('onoff').Gpio;
const exec = require('child_process').exec;

module.exports = NodeHelper.create({
  start: function () {
    this.started = false;
    this.screenOn = true;

    const self = this;
    exec("/opt/vc/bin/tvservice -s").stdout.on('data', function(data) { 
      this.screenOn = (data.indexOf('TV is off') == -1) ;
    });
  },

  activateMonitor: function () {
    if (!this.screenOn) {
      console.log((new Date()).toISOString() + " - Activating monitor");
      exec("/opt/vc/bin/tvservice -p", null);
      this.screenOn = true;
    }
  },

  deactivateMonitor: function () {
    if (this.screenOn) {
      console.log((new Date()).toISOString() + " - Deactivating monitor");
      exec("/opt/vc/bin/tvservice -o", null);
      this.screenOn = false;
    }
  },

  // Subclass socketNotificationReceived received.
  socketNotificationReceived: function(notification, payload) {
    if (notification === 'CONFIG' && !this.started) {
      const self = this;
      this.config = payload;

      //Setup pins
      this.pir = new Gpio(this.config.sensorPIN, 'in', 'both');

      //Detected movement
      this.pir.watch(function(err, value) {
        if (value == 1) {
          self.sendSocketNotification("USER_PRESENCE", true);
          clearTimeout(self.deactivateMonitorTimeout);
          self.activateMonitor();
        }
        else if (value == 0) {
          self.sendSocketNotification("USER_PRESENCE", false);
          self.deactivateMonitorTimeout = setTimeout(function() {
            self.deactivateMonitor();
          }, self.config.powerSavingDelay * 1000);
        }
      });

      this.started = true;

    } else if (notification === 'SCREEN_WAKEUP') {
      this.activateMonitor();
    }
  }

});
