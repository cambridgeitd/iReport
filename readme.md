# Cambridge iReport Mobile App
Cambridge iReport allows users to report common problems such as potholes, graffiti, broken traffic signals, etc. directly to the responsible departments within the [City of Cambridge](http://www.cambridgema.gov/) for resolution. The application is designed in a modular way such that it can be modified and customized for another organization quickly.

## Requirements
* [Cordova](https://cordova.apache.org/) v4.0.0

## Configuring and Building the Application
Customizing the application for your needs is a simple process:
1. Clone this repository
2. Edit the Cordova configuration (`/www/config.xml`) to suit your needs
3. Implement the [required web services](https://github.com/cambridgeitd/iReport/wiki/Webservices) iReport needs to interact with your back-end work order system
4. Edit `/www/js/config.js` to match your implementation - refer to the [iReport configuration guide](https://github.com/cambridgeitd/iReport/wiki/Config.js) for detailed information on the settings contained within.
5. Add your desired platforms in the Cordova project, build, and release!