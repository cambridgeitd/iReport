# Cambridge iReport Mobile App
Cambridge iReport allows users to report common problems such as potholes, graffiti, broken traffic signals, etc. directly to the responsible departments within the [City of Cambridge](http://www.cambridgema.gov/) for resolution. The application is designed in a modular way such that it can be modified and customized for another organization quickly.

## Requirements
* [Cordova](https://cordova.apache.org/) v4.0.0

## Configuring and Building the Application
Customizing the application for your needs is a simple process:
1. Clone this repository
2. Edit the Cordova configuration (`/www/config.xml`) to suit your needs
3. Implement the [required web services](configGuide.html#webservices) iReport needs to interact with your back-end work order system
4. Edit `/www/js/config.js` to match your implementation - refer to the [iReport configuration guide](configGuide.html#configjs) for detailed information on the settings contained within.
5. Add your desired platforms in the Cordova project, build, and release!

----
Anything below this line I'd break out to somewhere else - project Wiki, GitHub Pages, etc.
## Cordova Configuration
Edit `/www/config.xml` to suit your needs - at minimum:
* Set the `id` and `version` attributes of the root `<widget>` tag to something suitable for your organization
 * Set your application name in the `<name>` tag
 * Set your application description in the `<description>` tag
 * Set your contact information in the `<author>` tag
 
## Webservices
#### ClaimTicket
**Action:** Resets a ticket's ownership from one user to another

**Use:** When a user submits a ticket when not logged in, the ticket is assigned a random user token. If the user registers or logs in immediately after submitting the ticket, the `ClaimTicket` service is called to reassign the ticket to the user's correct ID.

#### Input Arguments
The service is called via an HTTP(S) POST - all arguments are required.
Argument | Description
---- | ----
`token` (string) | The temporary user ID assigned to the ticket on creation - temporary tokens will always be prefixed with `nouser_` and are returned as part of the return data from the `SubmitTicket` service.
`userID` (string) | The user's actual user ID which will replace the ticket's temporary token.

#### Return Structure
Data is returned as a JSON object
Variable | Description
-------- | -----------
`success` (bool) | Returns `true` if successful - a ticket was located with the specified `token` and it was successfully updated.
`message` (string) | Status text to be displayed to the user on success / failure.

#### CreateUser
**Action:** Creates a user.

**Use:** Create an account for the user to keep track of their tickets.

#### Input Arguments
The service is called via an HTTP(S) POST - all arguments are required.
Argument | Description
---- | ----
`email` (string) | E-mail address of the user.
`password` (string) | Password for the user.
`passwordConfirm` (string) | Password - Same as above
`firstName` (string) | First name of the user
`lastName` (string) | Last name of the user
`phone` (string) | Phone number of the user
#### Return Structure
Data is returned as a JSON object
Variable | Description
-------- | -----------
`success` (bool) | Returns `true` if successful - a user was created.
`userID` (string) | The user ID for the account.
`message` (string) | Status text to be displayed to the user on success / failure.

#### GetTickets
**Action:** Get a list of all the ticket the user has submitted.

**Use:** When the user goes to the status page of the app.

#### Input Arguments
The service is called via an HTTP(S) POST - all arguments are required.
Argument | Description
---- | ----
`deviceID` (string) | The user's ID
#### Return Structure
Data is returned as a JSON object
Variable | Description
-------- | -----------
`success` (bool) | Returns `true` if successful - a user was created.
`tickets` (obect) | Array of tickets the user has submitted. The stucture of a single array looks like this:
`message` (string) | Status text to be displayed to the user on success / failure.
##### `Tickets` Object Structure
Variable | Description
---- | ----
`Address` (string) | Address of where the ticket was submiited
`RequestType` (string) | What kind of a ticket is it
`Status` (string) | Status of the ticket
`SubmiitedDate` (string) | When was the ticket submited

#### Login
**Action:** Verifies if the user entered correct email address and password.

**Use:** To log in a user.

#### Input Arguments
The service is called via an HTTP(S) POST - all arguments are required.
Argument | Description
---- | ----
`email` (string) | E-mail address of the account.
`password` (string) | Password of the account.
#### Return Structure
Data is returned as a JSON object
Variable | Description
-------- | -----------
`success` (bool) | Returns `true` if successful - a user entered correct log on details.
`userID` (string) | The user ID for the account.
`message` (string) | Status text to be displayed to the user on success / failure.

#### SubmitTicket
**Action:** Submit a ticket

**Use:** Submit a ticket to the databse

#### Input Arguments
The service is called via an HTTP(S) POST - all arguments are required.
Argument | Description
---- | ----
`params` (array) | Contains data of the user and ticket.

##### `Params` Object Structure
Variable | Description
---- | ----
`device_id` (string) | Device / UserID.
`platform` (string) | Device platform.
`request_type` (string) | What kind of a ticket is it.
`location_streetNum` (string) | Street number.
`location_streetName` (string) | Street name.
`location_city` (string) | City.
`location_zipcode` (string) | Zip code.
`location_latitude` (float) | Latitude of the location.
`location_longitude` (float) | Longitude of the location.
`first_name` (string) | First name of the user.
`last_name` (string) | Last name of the user.
`phone_number` (string) | Phone number of the user.
`email_address` (string) | E-mail address of the user.
`description` (string) | Description of the ticket.
    
#### Return Structure
Data is returned as a JSON object
Variable | Description
-------- | -----------
`success` (bool) | Returns `true` if successful - a user was created.
`ticketToken` (string) | Token / ID of the ticket.
`message` (string) | Status text to be displayed to the user on success / failure.

#### ValidateAddress
**Action:** Validates the address against an internal addessing system

**Use:** When the user decides to enter the address manually we call this to make sure the address is valid with in a internal addressing system.

#### Input Arguments
The service is called via an HTTP(S) POST - all arguments are required.
Argument | Description
---- | ----
`location_streetNum` (string) | The street number.
`location_streetName` (string) | The street name.
#### Return Structure
Data is returned as a JSON object
Variable | Description
-------- | -----------
`success` (bool) | Returns `true` if successful - the address is valid
`message` (string) | Status text to be displayed to the user on success / failure.