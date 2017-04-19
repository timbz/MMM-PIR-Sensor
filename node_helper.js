'use strict';

const NodeHelper = require('node_helper');
const Gpio = require('onoff').Gpio;
const exec = require('child_process').exec;

module.exports = NodeHelper.create({
  start: function () {
    this.started = false;
    this.screenOn = true;
    this.powerSaving = true;

    const self = this;
    exec("/opt/vc/bin/tvservice -s").stdout.on('data', function(data) { 
      self.screenOn = (data.indexOf('TV is off') == -1) ;
    });
  },

  activateMonitor: function () {
    if (!this.screenOn) {
      console.log((new Date()).toISOString() + " - Activating monitor");
      exec("/opt/vc/bin/tvservice -e \"DMT 81\"", null);
      this.screenOn = true;
    }
  },

  deactivateMonitor: function () {
    if (this.powerSaving && this.screenOn) {
      console.log((new Date()).toISOString() + " - Deactivating monitor");
      exec("/opt/vc/bin/tvservice -o", null);
      this.screenOn = false;
    }
  },

  socketNotificationReceived: function(notification, payload) {
    if (notification === 'CONFIG' && !this.started) {
      const self = this;
      this.config = payload;

      //Setup pins
      this.pir = new Gpio(this.config.sensorPIN, 'in', 'both');

      //Detected movement
      this.pir.watch(function(err, value) {
        if (value == 1) {
          clearTimeout(self.deactivateMonitorTimeout);
          self.activateMonitor();
        }
        else if (value == 0) {
          self.deactivateMonitorTimeout = setTimeout(function() {
            self.deactivateMonitor();
          }, self.config.powerSavingDelay * 1000);
        }
      });

      this.started = true;

    } else if (notification === 'POWER_SAVING') {
      this.powerSaving = payload;
      if (!this.powerSaving) {
        this.activateMonitor();
      }
    }
  }

});
