/**
 * @file
 * The custom-app functions.
 *
 * @licence     Licence Link / Type
 * @version     2.4.1
 * @link        http://github.com/Company/Repositories
 * @author      City of Cambridge
 */

/**
 * Paramters
 */
var appShortName = "Your APP Name",
  appLongName = "Your APP Long Name",
  appVersion = "2.4.1";

// ReportTypes - Defines the acceptable report types and used to determine what kind of ticket layout to show
var ReportTypes = {
  pothole: "pothole",
  streetlight: "streetlight",
  rodent: "rodent",
  graffiti: "graffiti",
  missedpickup: "missedpickup",
  unshoveledsidewalk: "unshoveledsidewalk",
  freshpondissue: "freshpondissue",
  treemaintenance: "treemaintenance",
  parkmaintenance: "parkmaintenance",
  trafficsignal: "trafficsignal",
  trafficsign: "trafficsign",
  bikerack: "bikerack",
  sidewalkdefect: "sidewalkdefect",
  abandonedbicycle: "abandonedbicycle",
  taxicomplaint: "taxicomplaint"
};

// devHost - The protocol, host, and root path to your dev environment's webservices
var devHost = "http://devmobile.cambridgema.gov/iReport/webservices/";

// prodHost - The protocol, host, and root path to your production environment's webservices
var prodHost = "https://www.cambridgema.gov/iReport/webservices/";

// host - The active host for the app
var host = devHost;

// wsAddresses - Structure defining the URI's to the various web services required by the application
var wsAddresses = {
  CreateUser: host + "CreateUser.aspx",
  Login: host + "Login.aspx",
  ClaimTicket: host + "ClaimTicket.aspx",
  SubmitTicket: host + "SubmitTicket.aspx",
  GetTicket: host + "GetTicket.aspx",
  ValidateAddress: host + "validateaddress.aspx",
  GetNotifications: host + "Notifications.json"
};

// server_timeout_limit - Limits how long a request to the server can timeout for in MS
var server_timeout_limit = 30000;

/**
 * Map variables
 */
// maxAccAttempts - Defines the maximumn number of attempts to get an acceptably precise location on the user.
var maxAccAttempts = 5;

// bestLat and bestLon - Defines the location to use when no location can be determined.
var bestLat = 42.376768;
var bestLon = -71.120967;

// reqAccuracy - Defines the required resolution before accepting a GPS location (unless maxAccAttempts is reached). Specified in meters.
var reqAccuracy = 40;

/**
 * HTML for each page within the app
 */
var Templates = {
  // tabs - Navigation for the app
  tabs: "<div class='navigation'><ul class='nav'><li id='report' class='selected'><span class='icon'></span> Create Report</li><li id='status'><span class='icon'></span> View Status</li><li id='help'><span class='icon'></span> Help</li></ul></div><div id='tab-divider'></div>",
  // index - Main home page
  index: "<div class=drop-shadow></div><div id=main-selector class=content-home> <h1>I want to report...</h1> <div id=bug><img src=img/bug.png width=80 height=50> </div><fieldset> <select id=report-list name=reports> <option disabled value=()>Please select an item to report<option value=abandonedbicycle>Abandoned bicycle<option value=bikerack>Bike rack issue<option value=freshpondissue>Issue at Fresh Pond<option value=graffiti>Graffiti<option value=icystreet>Icy or snowy street<option value=parkmaintenance>Park maintenance issue<option value=pothole>Pothole<option value=rodent>Rodent<option value=missedpickup>Missed curbside pickups<option value=sidewalkdefect>Sidewalk defect<option value=streetlight>Defective streetlight or park light<option value=taxicomplaint>Taxi Complaint or Compliment<option value=trafficsign>Traffic sign complaint<option value=trafficsignal>Traffic signal complaint<option value=treemaintenance>Tree maintenance issue<option value=unshoveledsidewalk>Unshoveled or icy sidewalk </select> <a id=report-list-confirm class='button right'>Continue</a> </fieldset> <div id=help-blurbs> <ul> <li><p>Report an illegally parked or abandoned bicycle. Requests are checked each business day and initial inspections scheduled within two business days of receipt (weather and other circumstances permitting.) If you feel the situation is in need of immediate attention, please call <a href=tel:+16173494800>(617) 349-4800</a> to speak to a staff member.</p></li><li><p>Request installation of a new bike rack, or report issues with an existing bike rack such as damage or vandalism. Please be as specific as you can about the location of your request in the additional info field. The Traffic, Parking, and Transportation Department will respond to this complaint.</p></li><li><p>Issues reported at the Fresh Pond Reservation are reviewed by the Cambridge Water Department within 1-2 business days.</p></li><li><p>Please note that graffiti removal equipment cannot be used from mid-November through March. However, obscene or offensive tags will be painted over immediately year-round until removal can be scheduled.</p></li><li><p>During snow operations, Public Works goals are to chemically treat all major arteries within three hours of when snow begins, to keep main arteries plowed during all stages of a storm, and to clear all streets and the sidewalks bordering City property once a storm has stopped.</p><p>Snow/ice clearing iReport requests are checked on a regular basis when our snow operations center is open. If you feel the situation is an urgent safety issue, please feel free to call our 24 hour emergency line at <a href=tel:+16173494800>(617) 349-4800</a>.</p></li><li><p>Requests are checked each business day and initial inspections scheduled within two business days of receipt (weather and other circumstances permitting.)</p><p><strong>If you feel the situation is an urgent safety concern, please call our 24 hour emergency line at <a href=tel:+16173494800>(617) 349-4800</a> to speak to a staff member.</strong></p></li><li><p>Pothole reports are checked each business day and initial inspections are scheduled within two business days of receipt, weather and other circumstances permitting.</p><p><strong>If you feel the situation is an urgent safety concern, please call our 24 hour emergency line at <a href=tel:+16173494800>(617) 349-4800</a> to speak to a staff member.</strong></p></li><li><p>To assist inspectors with the Inspectional Services Department, please provide detailed information with your report, such as where you saw the rodent, time of day, etc.</p></li><li><p>If you think your recycling, trash, yard waste or compost was missed, please submit your request for pickup no later than 12 noon the day following collection. Please keep your missed material at the curb.</p><p>Please note that contact information is <strong>required</strong> for this type of report. In the additional info field please indicate what was missed (e.g. 1 trash barrel and 2 recycling toters.)</p></li><li><p>Requests are checked each business day and initial inspections scheduled within two business days of receipt (weather and other circumstances permitting.)</p><p><strong>If you feel the situation is an urgent safety concern, please call our 24 hour emergency line at <a href=tel:+16173494800>(617) 349-4800</a> to speak to a staff member.</strong></p></li><li><p>When filing a report please be as descriptive as possible about the location of the light, ideally including the number attached to the pole approximately six feet above the base, and the behavior of the light (flickering bulb, burned out, buzzing, etc.)</p></li><li><p>Report a complaint or compliment about a Cambridge taxi driver. Please include as much information as possible to assist in identifying the taxi.</p></li><li><p>Report an issue with traffic signs in the City, ranging from missing or vandalized signs to signs that you feel should be moved or changed. The Traffic, Parking, and Transportation Department will respond to these complaints.</p></li><li><p>Report an issue with traffic signals (traffic lights, pedestrian walk signals, etc.) in the city, from non-functional lights or pedestrian signals that are too quick. The Traffic, Parking, and Transportation Department will respond to these complaints.</p></li><li><p>Requests are checked each business day and initial inspections scheduled within two business days of receipt (weather and other circumstances permitting.)</p><p><strong>If you feel the situation is an urgent safety concern, please call our 24 hour emergency line at <a href=tel:+16173494800>(617) 349-4800</a> to speak to a staff member.</strong></p></li><li><p>Property owners must remove snow from sidewalks next to their property within 12 hours of daytime snowfall and before 1:00 PM of overnight snowfall. Ice must be removed within 6 hours of forming.</p></li></ul> </div><div id=logotype></div></div>",
  // map - Once a report type is picked we show map to determine users location
  map: "<div id='top-bar'>%text%</div><div id='map-holder'><div id='map'></div><div id='map-target' class='map-loader'></div></div><div id='map-tools'><div id='map-info-bar'>Finding you on map...</div><div id='bottom-holder' class='trans-on'><figure  class='button left'><div id='photo-holder' class='icon'></div></figure><a id='confirm-but' class='button confirm right'>Confirm location</a></div></div>",
  // report - Show after maps to gather data for the report
  report: "<div id='top-bar'>%text%</div><div class='content'><form id='report-form' onsubmit='return!1'><fieldset><legend class='hide'>located near:</legend><div class='location'><h3>Located near:</h3><p id='form-address'>%address%</p><a id='change-location' class='button green'>Change</a></div><div class='decor'><hr/></div><ol class='report-form'><li><label for='first_name'>First Name:</label><input id='first_name'></li><li><label for='last_name'>Last Name:</label><input id='last_name'></li><li><label for='phone_number'>Phone:</label><input id='phone_number' type='tel'></li><li><label for='email_address'>Email:</label><input id='email_address' type='email'></li><li id='pole_number_li' class='hidden'><label for='pole_number'>Pole Number:</label><input id='pole_number' type=number></li><li id='restaurant_li' class='hidden'><label for='restaurant'>Is this a restaurant?</label><select id='restaurant'><option value='Yes'>Yes</option><option value='No' selected>No</option></select></li><li id='profanity_li' class='hidden'><label for='profanity'>Graffiti is profane?</label><select id='profanity'><option value='Yes'>Yes</option><option value='No' selected>No</option></select></li><li id='missed_li' class='hidden'><label>What was missed?</label><ol class='sub'><li><label class='pickupCheckBox'><input type='checkbox' id='check1' name='missed' value='rubbish' checked class='short'> Rubbish</label></li><li><label class='pickupCheckBox'><input type='checkbox' id='check2' name='missed' value='recycling' class='short'> Recycling</label></li><li><label class='pickupCheckBox'><input type='checkbox' id='check3' name='missed' value='yard waste' class='short'> Yard Waste</label></li><li><label class='pickupCheckBox'><input type='checkbox' id='check4' name='missed' value='compost' class='short'> Compost</label></li></ol></li><li id='collection_day_li' class='hidden'><label for='collection_day'>Regular collection day:</label><select id='collection_day'><option value='Monday' selected>Monday</option><option value='Tuesday'>Tuesday</option><option value='Wednesday'>Wednesday</option><option value='Thursday'>Thursday</option><option value='Friday'>Friday</option></select></li><li id='traffic_signal_complaint_type_li' class='hidden'><label for='traffic_signal_complaint_type'>Type of complaint:</label><select id='traffic_signal_complaint_type'><option value='General' selected>General Maintenance</option><option value='Driving'>Driving</option><option value='Walking'>Walking</option><option value='Cycling'>Cycling</option></select></li><li id='traffic_signal_complaint_li' class='hidden'><label for='traffic_signal_complaint'>Complaint:</label><select id='traffic_signal_complaint'><option></option></select></li><li id='traffic_sign_type_li' class='hidden'><label for='traffic_sign_type'>Type of sign:</label><select id='traffic_sign_type'><option>Do not enter</option><option>Disabled</option><option>Loading zone</option><option>No parking</option><option>No stopping</option><option>One way</option><option>Resident permit parking</option><option>Snow emergency</option><option>Speed limit</option><option>Stop</option><option>Street cleaning</option><option>Street name</option><option>Other</option></select></li><li id='traffic_sign_type_other_li' class='hidden'><label for='traffic_sign_type_other'>Other:</label><input id='traffic_sign_type_other'></li><li id='traffic_sign_complaint_li' class='hidden'><label for='traffic_sign_complaint'>Complaint:</label><select id='traffic_sign_complaint'><option>Sign is missing</option><option>Sign has been vandalized</option><option>Sign is faded or illegible</option><option>Sign is facing the wrong direction</option><option>Move the sign to another location</option><option>Remove sign</option><option>Change the sign</option></select></li><li id='bike_rack_request_li' class='hidden'><label for='bike_request_type'>Request:</label><select id='bike_request_type'><option value='Repair damaged rack'>Repair damaged rack</option><option value='Install new rack'>Install new rack</option></select></li><li id='bike_rack_type_li' class='hidden'><label for='bike_rack_type_li'>Type of Rack:</label><select id='bike_rack_type'><option>Inverted U</option><option>Post and ring</option><option>Swerve</option><option>Multiple racks on a rail</option><option>Other / not sure</option></select></li><li id='bike_rack_damage_type_li' class='hidden'><label for='bike_rack_damage_type'>Type of Damage:</label><select id='bike_rack_damage_type'><option>Rack is damaged</option><option>Rack has been vandalized</option><option>Rack is missing</option></select></li><li id='tree_maint_action_li' class='hidden'><label for='tree_maint_action'>Action:</label><select id='tree_maint_action'><option>Prune tree</option><option>Plant tree</option><option>Inspect tree for pest/disease</option><option>Other</option></select></li><li id='taxi_complaints_medallion_num_li' class='hidden'><label for='taxi_complaint_medallion_num'>Medallion #:</label><input type='text' id='medallion_number'></li><li id='taxi_complaints_plate_num_li' class='hidden'><label for='taxi_complaint_plate_num'>Plate #:</label><input type='text' id='plate_number'></li><li id='taxi_complaints_pickup_time_li' class='hidden'><label for='taxi_complaint_pickup_time'>Pickup Time:</label><input type='time' class='fullwidthfix' id='time'></li><li id='taxi_complaints_date_li' class='hidden'><label for='taxi_complaint_date'>Date:</label><input type='date' class='fullwidthfix' id='date'></li><li id='taxi_complaints_report_type_li' class='hidden'><label for='taxi_complaint_report_type'>Report:</label><select id='report'><option>Refused to transport</option><option>Overcharged</option><option>Rude and Discourteous</option><option>Refused to take credit card</option><option>Wrong route or location</option><option>Compliment</option><option>Other</option></select></li><li><label for='description' class='textarea' type='text'>Include additional info (optional)</label><textarea id='description' name='Additional Info'></textarea></li></ol><button id='cancel-form' type='reset' class='red'>Cancel</button><button id='submit-form' type='submit' class='gold'>Submit</button></fieldset></form></div>",
  // status - Shows all the tickets the user has and their status
  status: "<div class='drop-shadow'></div><div class='content view-status'><a id='reports-logout-but' class='gold' style='height:28px;display:inline-block;width:50px;margin-top:0;margin-right:10px;position:absolute;right: 0;border-radius:3px;font: bold 12px/31px \"Helvetica Neue\", Helvetica, Arial, sans-serif;text-align:center;padding:0 5px;'>Sign Out</a><a href='#' class='gold' onclick=\"window.open(encodeURI('http://cambridgema.gov/iReport/Account'), '_system');\" style='display:inline-block;margin-top:30px;margin-right:10px;position:absolute;right: 0;border-radius:3px;font: bold 12px/31px \"Helvetica Neue\", Helvetica, Arial, sans-serif;text-align:center;padding:0 5px;color:White;text-decoration:none;'>Settings</a><h1>Your reports:</h1><table id='reports-table' class='reports' cellspacing='0'></table><div class='support'><p>If you would like more information about a specific report, please call <a href='tel:+1-617-349-4000'>(617) 349-4000</a></p></div></div>",
  // help - Shows the help page
  help: "<div class='drop-shadow'></div><div class='content'><a name='top'><h1>" + appLongName + "</h1></a><p>For support with " + appLongName + ", please visit <a href='#' onclick=\"window.open(encodeURI('http://www.cambridgema.gov/iReport/Support'), '_system');\">www.cambridgema.gov/iReport/Support</a>.</p></div>",
  // camera1 - Shows if the user doesn't have any picture already selected
  camera1: "<div id='choose-camera' class='menu-item'>From Camera</div><div id='choose-library' class='menu-item'>From Library</div><div id='feedback-close' class='menu-item'>Close</div>",
  // camera2 - Shows if the user does have a picture selected
  camera2: "<div id='choose-camera' class='menu-item'>From Camera</div><div id='choose-library' class='menu-item'>From Library</div><div id='remove-photo' class='menu-item'>Remove</div><div id='feedback-close' class='menu-item'>Close</div>",
  // statusRow - Layout for status of the ticket
  statusRow: "<tr><td class='detail'><strong>%date%</strong>%type% located near:<strong>%address%</strong></td><td class='status' valign='middle'>%status%</td></tr><tr><td colspan='2' class='decor'><hr /></td></tr>",
  // address - Shows when the user is entering their address manually
  address: "<div id='top-bar'>%text%</div><div class='content'><div id='matches-list'></div><form id='address-form' onSubmit='return false'><fieldset><legend class='hide'>located near:</legend><ol class='report-form'><li><label for='street_number'>Street #:</label><input id='change-street-number' type='text' /></li><li><label for='street_name'>Street Name:</label><input id='change-street-name' type='text' /></li></ol><button id='cancel-address' type='reset' class='red left'>Cancel</button><button id='submit-address' type='submit' class='gold right'>Submit</button></fieldset></form></div>"
};
