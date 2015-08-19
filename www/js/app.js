/**
 * @file
 * The core app functions.
 *
 * @licence     Licence Link / Type
 * @version     2.4.1
 * @link        http://github.com/Company/Repositories
 * @author      City of Cambridge
 */

var init, googleCallback;

( function ( ) {

  /**
   * Global Variables that will be used through out the app
   */
  var $ = xui,
    content = null,
    header = null,
    activeTab = null,
    activeTitle = null,
    feedback = null,
    hider = null,
    signup = null,
    login = null,
    lastUnclaimedTicket = "",
    currentPage = "index",
    Params = {},
    coc = {},
    server_timeout = null,
    server_xhr = null,

    /**
     * Map variables
     */
    activeMap = null,
    addressBar = null,
    geocoder = null,
    geoCodeIntervalID = null,
    geoCodeIntervalCount = 0,
    crosshair = null,
    bestAcc = 9999,
    accAttempts = 1,
    geoAttempts = 1,
    locating = false,
    windowHeight = false,
    tip_shown = false,

    /**
     * Report variables
     */
    submit_but = null,
    submitTime = 0,
    cancel_but = null,

    /**
     * Change Address
     */
    change_street_number = null,
    change_street_name = null,
    matchesList = null;

  /**
   * Merge the contents of two or more objects together into the first object.
   */
  $.extend( {

    val: function ( v ) {
      if ( v ) {
        this[ 0 ].value = v;
      }

      return this[ 0 ].value;
    },

    selected: function ( ) {
      var o = this[ 0 ];

      return o.item( o.options.selectedIndex );

    },

    offsetTop: function ( v ) {
      if ( v ) {
        this[ 0 ].offsetTop = v;
      }

      return this[ 0 ].offsetTop;
    }

  } );

  /**
   * Sets the view to a differnet page
   * @param: {Variable} p
   * @param: {Function} cb
   */
  function setCurrentPage( p, cb ) {
    window.scrollTo( 0, 0 );
    currentPage = p;

    setTimeout( function ( ) {

      hideSignup( );
      hideLogin( );

      content.setStyle( "visibility", "hidden" );
      content.html( "" );
      cb( );
      content.setStyle( "visibility", "visible" );

    }, 500 );

    return false;
  }

  /**
   * Replaces sources in the template with new values
   * @param: {HTMLElement} s
   * @param: {HTMLElement} t
   * @param: {HTMLElement} v
   */
  function reg( s, t, v ) {
    return s.replace( t, v );
  }

  /**
   * Replaces sources in the template with new values
   * @param: {HTMLElement} s
   * @param: {HTMLElement} t
   * @param: {HTMLElement} v
   */
  function reg2( s, t, v ) {
    var i = 0,
      ns = s;
    while ( i < t.length ) {
      ns = ns.replace( t[ i ], v[ i ] );
      i = i + 1;
    }
    return ns;
  }

  // can be commented out for deployment
  function get( url, cb ) {
    var xmlhttp = new XMLHttpRequest( );
    xmlhttp.open( "GET", url, true );
    xmlhttp.onreadystatechange = function ( ) {
      if ( xmlhttp.readyState == 4 ) {
        cb( xmlhttp.responseText );
      }
    }
    xmlhttp.send( "" );
  }

  /**
   * Generates random numbers
   */
  function S4( ) {
    return ( Math.floor( ( 1 + Math.random( ) ) * 0x10000 ) ).toString( 16 ).substring( 1 );
  }

  /**
   * Creates a GUID based on @method: S4
   */
  function makeUuid( ) {
    var uuid;
    try {
      uuid = window.localStorage.getItem( "uuid" );
      if ( !uuid ) {
        uuid = ( S4( ) + S4( ) + S4( ) + S4( ) + S4( ) + S4( ) + S4( ) + S4( ) );
        window.localStorage.setItem( "uuid", uuid );
      }
    } catch ( e ) {
      navigator.notification.alert(
        "Your device does not support local storage!",
        null,
        "Alert",
        "Close"
      );
    }

    return uuid || "unknown";
  }

  /**
   * Get userID from the local storage
   */
  function getUserID( ) {
    var userID;

    try {
      userID = window.localStorage.getItem( "userID" );
    } catch ( error ) {
      navigator.notification.alert(
        "Your device does not support local storage!",
        null,
        "Alert",
        "Close"
      );
    }

    return userID || "";
  }

  /**
   * Stores the userID in the local storage
   * @param: {variable} userID
   */
  function storeUserID( userID ) {
    try {
      window.localStorage.setItem( "userID", userID );
      return true;
    } catch ( error ) {
      navigator.notification.alert(
        "Your device does not support local storage!",
        null,
        "Alert",
        "Close"
      );
    }

    return false;
  }

  /**
   * This function removes the local storage item named "userID" and redirects
   * the user to the reports page
   */
  function confirmUserLogout( ) {
    navigator.notification.confirm( "Are you sure you want to sign out?",
      function ( confirm ) {
        // Check that the user confirms
        if ( confirm == 1 ) {
          try {
            window.localStorage.removeItem( "userID" );
            navigator.notification.alert(
              "You have been signed out.",
              function ( ) {
                // Switch to Report tab
                index( );
                switchTabs( $( "#report" ) );
              }
            );
          } catch ( error ) {
            navigator.notification.alert(
              "Your device does not support local storage!",
              null,
              "Alert",
              "Close"
            );
          }
        }
      },
      "Confirm", [ "Yes", "No" ]
    );
  }

  /**
   * This method is used to claim any ticket the user has submitted while not being logged in
   */
  function claimTicket( ) {
    var formData = {
      ticketToken: lastUnclaimedTicket,
      deviceID: getUserID( )
    };

    server_timeout = setTimeout( abortXHR, server_timeout_limit );

    server_xhr = content.xhr( wsAddresses.ClaimTicket, {
      async: true,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      data: paramaterizeObject( formData ),
      error: function ( e ) {
        clearXHR( );
      },
      callback: function ( ) {
        clearXHR( );

        try {
          var r = JSON.parse( this.responseText );
        } catch ( e ) {} finally {
          hideFeedback( );
          status( );
        }
      }
    } );

    updateFeedbackSpinner( "<p>Associating last submitted report with your account...</p>" );
    showFeedback( );

    return false;
  }

  /**
   * Return a URL-encoded string of name-value pairs from \an object. Suitable for sending as query string.
   * @param: {Object} obj
   */
  function paramaterizeObject( obj ) {
    var a = [ ],
      o;
    for ( o in obj ) {
      if ( obj.hasOwnProperty( o ) ) {
        a.push( o + "=" + encodeURIComponent( obj[ o ] ) || "" );
      }
    }
    return a.join( "&" );
  }

  /**
   * Email validation to make sure the user have entered a valid email address
   * @param: {HTMLElement} email
   */
  function validateEmail( email ) {
    var re = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}/gi;

    return re.test( email );
  }

  /**
   * Sign up functions
   * @method: validateSignupForm
   * @method: showSignup
   * @method: hideSignup
   * @method: submitSignup
   * @method: cancelSignup
   */

  /**
   * Validates the signup form to make sure all required inputs are filled
   * @param: {HTMLElement} event
   */
  function validateSignupForm( event ) {

    var form = event.target.form;
    var invalid = true;
    var errorTitle = "";
    var errorMessage = "";

    if ( form.elements[ "su_first_name" ].value.length == 0 ) {
      errorTitle = "Error: First Name";
      errorMessage = "A first name is required.";
    } else if ( form.elements[ "su_last_name" ].value.length == 0 ) {
      errorTitle = "Error: Last Name";
      errorMessage = "A last name is required.";
    } else if ( form.elements[ "su_phone_number" ].value.length == 0 ) {
      errorTitle = "Error: Phone";
      errorMessage = "A phone number is required.";
    } else if ( form.elements[ "su_email_address" ].value.length == 0 ) {
      errorTitle = "Error: Email";
      errorMessage = "An email address is required.";
    } else if ( !validateEmail( form.elements[ "su_email_address" ].value ) ) {
      errorTitle = "Error: Email";
      errorMessage = "Please enter a valid email address.";
    } else if ( form.elements[ "su_password" ].value.length == 0 ) {
      errorTitle = "Error: Password";
      errorMessage = "A password is required.";
    } else if ( form.elements[ "su_password_again" ].value.length == 0 ) {
      errorTitle = "Error: Confirm Password";
      errorMessage = "Please re-type your password.";
    } else if ( form.elements[ "su_password" ].value != form.elements[ "su_password_again" ].value ) {
      errorTitle = "Error: Confirm Password";
      errorMessage = "Passwords do not match.";
    } else {
      invalid = false;
    }

    if ( invalid ) {
      navigator.notification.alert( errorMessage, null, errorTitle, "OK" );
      return false;
    } else {
      updateFeedbackSpinner( "<p>Signing up! Please wait...</p>" );
      setTimeout( showFeedback, 400 );
      setTimeout( function ( ) {
        submitSignup( event );
      }, 500 );
    }

    return false;
  }

  /**
   * Shows the signup page
   */
  function showSignup( ) {
    hideLogin( );
    signup.setStyle( "display", "block" );
    signup.setStyle( "left", "0" );
  }

  /**
   * Hides the signup page
   */
  function hideSignup( ) {
    signup.setStyle( "display", "none" );
    signup.setStyle( "left", "-9999" );
  }

  /**
   * Signup submit button
   * @param: {HTMLElement} event
   */
  function submitSignup( event ) {

    var form = event.target.form;
    var errorTitle = "";
    var errorMessage = "";
    var errorCallback = null;

    var formData = {
      email: form.elements[ "su_email_address" ].value,
      firstname: form.elements[ "su_first_name" ].value,
      lastname: form.elements[ "su_last_name" ].value,
      password: form.elements[ "su_password" ].value,
      passwordConfirm: form.elements[ "su_password_again" ].value,
      phone: form.elements[ "su_phone_number" ].value
    };

    server_timeout = setTimeout( abortXHR, server_timeout_limit );

    server_xhr = content.xhr( wsAddresses.CreateUser, {
      async: true,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      data: paramaterizeObject( formData ),
      error: function ( e ) {
        clearXHR( );
      },
      callback: function ( ) {
        clearXHR( );

        try {
          var r = JSON.parse( this.responseText );
          if ( r.success ) {

            // Save user ID to device
            storeUserID( r.userID );
            window.localStorage.setItem( "first_name", formData.email );
            window.localStorage.setItem( "last_name", formData.firstname );
            window.localStorage.setItem( "email_address", formData.lastname );
            window.localStorage.setItem( "phone_number", formData.phone );

            errorTitle = "Success!";
            errorMessage = r.message || "Sign up was successful.";

            // Claim the last ticket, if need be
            if ( lastUnclaimedTicket ) {
              errorCallback = claimTicket;
            } else {
              errorCallback = status;
            }
          } else {
            errorTitle = "Error";
            errorMessage = r.message || "We are unable to sign you up at this time.";
          }
        } catch ( e ) {
          errorTitle = "Uh oh";
          errorMessage = "Something went wrong.";
        } finally {
          hideFeedback( );
          navigator.notification.alert(
            errorMessage,
            errorCallback,
            errorTitle,
            "OK"
          );
        }
      }
    } );

    return false;
  }

  /**
   * The cancel button was pressed on the sign up form
   * @param: {HTMLElement} event
   */
  function cancelSignup( event ) {
    event.target.form.reset( );
    $( "#report" ).fire( "click" );

    return false;
  }

  /**
   * Log in functions
   * @method: validateLoginForm
   * @method: showLogin
   * @method: hideLogin
   * @method: submitLogin
   */

  /**
   * Validates the login form to make sure all required inputs are filled
   * @param: {HTMLElement} event
   */
  function validateLoginForm( event ) {

    var form = event.target.form;
    var invalid = true;
    var errorTitle = "";
    var errorMessage = "";

    if ( form.elements[ "li_email_address" ].value.length == 0 ) {
      errorTitle = "Error: Email";
      errorMessage = "An email address is required.";
    } else if ( !validateEmail( form.elements[ "li_email_address" ].value ) ) {
      errorTitle = "Error: Email";
      errorMessage = "Please enter a valid email address.";
    } else if ( form.elements[ "li_password" ].value.length == 0 ) {
      errorTitle = "Error: Password";
      errorMessage = "A password is required.";
    } else {
      invalid = false;
    }

    if ( invalid ) {
      navigator.notification.alert( errorMessage, null, errorTitle, "OK" );
      return false;
    } else {
      updateFeedbackSpinner( "<p>Logging in, please wait...</p>" );
      setTimeout( showFeedback, 400 );
      setTimeout( function ( ) {
        submitLogin( event );
      }, 500 );
    }

    return false;
  }

  /**
   * Shows the login page
   */
  function showLogin( ) {
    hideSignup( );
    login.setStyle( "display", "block" );
    login.setStyle( "left", "0" );
  }

  /**
   * Hides the login page
   */
  function hideLogin( ) {
    login.setStyle( "display", "none" );
    login.setStyle( "left", "-9999" );
  }

  /**
   * Login submit button
   * @param: {HTMLElement} event
   */
  function submitLogin( event ) {

    var form = event.target.form;
    var errorTitle = "";
    var errorMessage = "";
    var errorCallback = null;

    var formData = {
      email: form.elements[ "li_email_address" ].value,
      password: form.elements[ "li_password" ].value
    };

    server_timeout = setTimeout( abortXHR, server_timeout_limit );
    $.Ajax
    server_xhr = content.xhr( wsAddresses.Login, {
      async: true,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      data: paramaterizeObject( formData ),
      error: function ( e ) {
        clearXHR( );
      },
      callback: function ( ) {
        clearXHR( );

        try {
          var r = JSON.parse( this.responseText );
          if ( r.success ) {

            // Save user ID to device
            storeUserID( r.userID );
            window.localStorage.setItem( "email_address", formData.email );

            errorTitle = "Success!";
            errorMessage = r.message || "You can now view your report statuses whenever you like.";

            // Claim the last ticket, if need be
            if ( lastUnclaimedTicket ) {
              errorCallback = claimTicket;
            } else {
              errorCallback = status;
            }
          } else {
            errorTitle = "Error";
            errorMessage = r.message || "We were unable to log you in at this time.";
          }
        } catch ( e ) {
          errorTitle = "Uh oh";
          errorMessage = "Something went wrong.";
        } finally {
          hideFeedback( );
          navigator.notification.alert(
            errorMessage,
            errorCallback,
            errorTitle,
            "OK"
          );
        }
      }
    } );

    return false;
  }

  /**
   * The cancel button was pressed on the login form
   * @param: {HTMLElement} event
   */
  function cancelLogin( event ) {
    event.target.form.reset( );
    $( "#report" ).fire( "click" );

    return false;
  }

  /**
   * If the user is logged in do not show the login and signup page
   */
  function initAuthentication( ) {
    var a, b, c, d, e, f, g;

    a = new coc.ui.FastButton( document.getElementById( "signup-home-but" ), function ( ) {
      $( "#report" ).fire( "click" )
    } );
    b = new coc.ui.FastButton( document.getElementById( "signup-login-but" ), showLogin );
    c = new coc.ui.FastButton( document.getElementById( "login-back-but" ), showSignup );
    d = new coc.ui.FastButton( document.getElementById( "submit-signup-form" ), validateSignupForm );
    e = new coc.ui.FastButton( document.getElementById( "cancel-signup-form" ), cancelSignup );
    f = new coc.ui.FastButton( document.getElementById( "submit-login-form" ), validateLoginForm );
    g = new coc.ui.FastButton( document.getElementById( "cancel-login-form" ), cancelLogin );

    hideLogin( );
    hideSignup( );
  }

  /**
   * Feedback functions
   * @method: showFeedback
   * @method: updateFeedback
   * @method: hideFeedback
   * @method: updateFeedbackButtons
   * @method: abortXHR
   * @method: clearXHR
   */

  /**
   * Shows a popup dialog
   */
  function showFeedback( ) {
    feedback.setStyle( "left", ( window.innerWidth / 2 ) - 100 + "px" );
    feedback.setStyle( "top", "60px" );
    window.scroll( 0, 0 );
    hider.setStyle( "display", "block" );
    feedback.setStyle( "display", "block" );

    return false;
  }

  /**
   * Changes text in the popup dialog
   * @param: {String} t
   */
  function updateFeedback( t ) {
    feedback.html( '<span id="wait-text">' + t + '</span>' );

    return false;
  }

  /**
   * Hides the feedback popup dialog
   */
  function hideFeedback( ) {
    updateFeedback( "" );
    hider.setStyle( "display", "none" );
    feedback.setStyle( "display", "none" );

    return false;
  }

  /**
   * Changes the entire text in the popup dialogs
   * @param: {String} t
   */
  function updateFeedbackButtons( t ) {
    feedback.html( t );

    return false;
  }

  /**
   * Changes the feedback popup dialog to a loader and adds text
   * #param: {String} t
   */
  function updateFeedbackSpinner( t ) {
    feedback.html( '<img src="img/ajax-loader-2.gif" width="31" height="31" border="0" /><span id="wait-text">' + t + '</span>' );

    return false;
  }

  /**
   * Cancels the Http request
   */
  function abortXHR( ) {
    try {
      server_xhr.xmlHttpRequest.abort( );
    } catch ( e ) {
      console.log( e );
    }
    server_timeout = null;
    hideFeedback( );
    navigator.notification.alert(
      "Server timed out. Please try again.",
      null,
      "Alert",
      "Close"
    );

    return false;
  }

  /**
   * Clears the timeout
   */
  function clearXHR( ) {
    clearTimeout( server_timeout );
    server_timeout = null;
  }

  /**
   * Go to the help page and display the help text
   */
  function help( ) {
    setCurrentPage( "help", function ( ) {
      content.html( Templates.help );
    } );
    return true;
  };

  /**
   * Show all the tickets the user has submitted
   * @param: {Array} a
   */
  function showReports( a ) {
    var table = $( "#reports-table" ),
      t = [ "%date%", "%type%", "%address%", "%status%" ],
      html = "",
      i = 0,
      l = a.length,
      o;
    if ( l > 0 ) {
      while ( i < l ) {
        o = a[ i ];
        html = html + reg2( Templates.statusRow, t, [ o.SubmittedDate, o.RequestType, o.Address, o.Status ] );
        i = i + 1;
      }
      table.html( html );
    } else {
      table.html( "No reports" );
    }
    hideFeedback( );

    var a = new coc.ui.FastButton( document.getElementById( "reports-logout-but" ), confirmUserLogout );
  }

  /**
   * Go to the server and get all the tickets the user has submitted
   */
  function getReports( ) {

    if ( getUserID( ) == "" ) {
      showSignup( );
      return false;
    } else {
      hideSignup( );
    }

    Params.device_id = getUserID( );

    server_timeout = setTimeout( abortXHR, server_timeout_limit );
    server_xhr = content.xhr( wsAddresses.GetTicket + "?deviceID=" + Params.device_id, {
      async: true,
      method: 'get',
      headers: {
        'Content-Type': 'text/plain'
      },
      error: function ( ) {
        clearXHR( );
      },
      callback: function ( ) {
        clearXHR( );
        try {
          var r = JSON.parse( this.responseText );
          if ( r.success ) {
            showReports( r.tickets );
          }
        } catch ( e ) {
          hideFeedback( );
        }
      }
    } );
    updateFeedbackSpinner( "<p>Fetching reports, please wait...</p>" );
    showFeedback( );
    return false;
  }

  /**
   * Change the page to status
   */
  function status( ) {
    setCurrentPage( "status", function ( ) {
      content.html( Templates.status );
      getReports( );
    } );

    return true;
  };

  /**
   * Position the map correctly to fit the device
   */
  function positionMap( ) {
    var mh, map, mt, mtoo, mapHeight;
    mh = $( "#map-holder" );
    mtoo = $( "#map-tools" );
    map = $( "#map" );
    mt = $( "#map-target" );
    mapHeight = ( windowHeight - mh.offsetTop( ) - 120 ) + 'px';
    mh.setStyle( "height", mapHeight );
    map.setStyle( "height", mapHeight );
    mt.setStyle( "height", mapHeight );
    addressBar = $( "#map-info-bar" );
    crosshair = mt;
    return false;
  }

  /**
   * Prepares the map
   */
  function prepareMap( e ) {
    var item = $( "#report-list" ).selected( );

    Params.starting_new_ticket = true;

    if ( item.value == "()" ) {
      navigator.notification.alert(
        "You need to select a report type before continuing",
        null,
        'Whoops',
        'Okay'
      );
      return;
    }

    activeTitle = item.text;
    Params.request_type = item.value;
    map( );
  }

  /**
   * Gives users an options to enter address or find on map
   */
  function chooseAddressMethod( ) {
    var a, b;

    updateFeedbackButtons( "<div id='use-map' class='menu-item'>Use Map</div><div id='use-form' class='menu-item'>Enter Address</div>" );
    showFeedback( );

    a = new coc.ui.FastButton( document.getElementById( "use-map" ), map );
    b = new coc.ui.FastButton( document.getElementById( "use-form" ), address );

    return false;
  }

  /**
   * Creates a confirm and add photo button
   */
  function addMapEvents( ) {
    var a, b;

    a = new coc.ui.FastButton( document.getElementById( "confirm-but" ), report );
    b = new coc.ui.FastButton( document.getElementById( "photo-holder" ), onAddPhoto );

    return false;
  }

  /**
   * Adds a blue dot on the center of the map
   */
  function initMapDom( ) {
    addressBar.html( ( Params.location_streetNum || '' ) + " " + ( Params.location_streetName || '' ) );
    crosshair.toggleClass( "map-loader" );
    crosshair.addClass( "blue-dot" );
    $( "#bottom-holder" ).setStyle( "opacity", 1 );
    return false;
  }

  /**
   * Set the address the user has given
   * @param: {Object} results
   * @param: {String} status
   */
  function onGeoCode( results, status ) {
    if ( status === "OK" ) {
      var oo = results[ 0 ].address_components,
        i = 0,
        type, e;
      while ( i < oo.length ) {
        e = oo[ i ];
        type = e.types[ 0 ];
        switch ( type ) {
          case 'street_number':
            Params.location_streetNum = e.short_name;
            break;
          case 'route':
            Params.location_streetName = e.short_name;
            break;
          case 'locality':
            Params.location_city = e.short_name;
            break;
          case 'postal_code':
            Params.location_zipcode = e.short_name;
            break;
        }
        i = i + 1;
      }
      initMapDom( );
    } else if ( status === "OVER_QUERY_LIMIT" ) {
      // Relax, man.
    } else {
      navigator.notification.alert(
        "Address not found : " + status,
        null,
        "Alert",
        "Close"
      );
    }
  }

  /**
   * Once the user is done dragging on the map look up the address
   */
  function onMapDragEnd( ) {
    if ( geoCodeIntervalID ) {
      clearInterval( geoCodeIntervalID );
    }

    Params.location_latitude = activeMap.getCenter( ).lat( );
    Params.location_longitude = activeMap.getCenter( ).lng( );

    geoCodeIntervalCount = 0;
    geoCodeIntervalID = setInterval( doGeoCode, 1000 );

    addressBar.html( "Looking up address..." );
  }

  /**
   * Get Geo Code
   */
  function doGeoCode( ) {
    Params.location_latitude = activeMap.getCenter( ).lat( );
    Params.location_longitude = activeMap.getCenter( ).lng( );

    geocoder.geocode( {
      'latLng': new google.maps.LatLng( Params.location_latitude, Params.location_longitude )
    }, onGeoCode );

    if ( geoCodeIntervalCount++ > 2 ) {
      clearInterval( geoCodeIntervalID );
    }
  }

  /**
   * Set the lan and lat
   * @param: {Float} lan
   * @param: {Float} lat
   */
  function acceptPosition( lon, lat ) {
    locating = false;
    Params.location_latitude = lat;
    Params.location_longitude = lon;
    setMap( );
  }

  /**
   * Got Geo location
   * @param: {Object} e
   */
  function onLocWin( e ) {
    var acc = e.coords.accuracy,
      lon = e.coords.longitude,
      lat = e.coords.latitude;

    if ( acc < bestAcc ) {
      bestAcc = acc;
      bestLat = lat;
      bestLon = lon;
    }

    if ( geoAttempts < 2 ) {
      if ( accAttempts < maxAccAttempts ) {
        if ( bestAcc < reqAccuracy ) {
          acceptPosition( bestLon, bestLat );
        } else {
          addressBar.html( "Refining... (pass " + accAttempts + " of 4)" );
          setTimeout( getNavigator, 2500 );
        }
      } else {
        acceptPosition( bestLon, bestLat );
      }
      accAttempts = accAttempts + 1;
    } else {
      acceptPosition( bestLon, bestLat );
    }
  }

  /**
   * Failed to get Geo location
   * @param: {Object} e
   */
  function onLocFail( e ) {
    locating = false;
    switch ( e.code ) {
      case e.PERMISSION_DENIED:
        navigator.notification.alert( appName + " was denied access to your device's GPS receiver. The app will work without this, but for the best user experience we strongly encourage you to allow access to this app.", null, "Notice", "OK" );
        acceptPosition( -71.120967, 42.376768 );
        break;
      case e.POSITION_UNAVAILABLE:
        addressBar.html( "Position unavailable" );
        acceptPosition( -71.120967, 42.376768 );
        break;
      case e.TIMEOUT:
        // Only allow 3 attempts, give up if we can't get the location by then
        if ( geoAttempts >= 3 ) {
          navigator.notification.alert( "We were unable to determine your location, please drag the blue dot to the location of your report." );
          acceptPosition( -71.120967, 42.376768 );
        } else {
          addressBar.html( "Location request timed out, retrying..." );
          geoAttempts = geoAttempts + 1;
          getNavigator( );
        }
        break;
      case e.UNKNOWN_ERROR:
        addressBar.html( "Unknown error requesting location, defaulting." );
        acceptPosition( -71.120967, 42.376768 );
        break;
    }
  }

  /**
   * Get user locaiton via geo location
   */
  function getNavigator( ) {
    try {
      navigator.geolocation.getCurrentPosition( onLocWin, onLocFail, {
        maximumAge: 3000,
        enableHighAccuracy: true,
        timeout: 5000
      } );
      locating = true;
    } catch ( e ) {
      locating = false;
      navigator.notification.alert(
        'Device has no navigator capabilities.',
        null,
        "Alert",
        "Close"
      );
    }
  }

  /**
   * Adds the picture the user taken / choosen to the dom
   */
  function addPhotoToDom( ) {
    if ( Params.attachment_data ) {
      var image = $( "#photo-holder" );
      image.html( "<img src='" + Params.attachment_data + "' width='100%' height='100%' border='0'>" );
    }
  }

  /**
   * Adds the picture the user taken / choosen to the dom
   */
  function restorePhoto( ) {
    if ( Params.attachment_data ) {
      addPhotoToDom( );
    }
    return false;
  }

  /**
   * Add spinner to the dom
   */
  function addCameraSpinner( ) {
    var ph = $( "figure > .icon" );
    ph.setStyle( "background", "url(img/bars.gif) no-repeat scroll center center" );
    return false;
  }

  /**
   * Remove spinner from the dom
   */
  function removeCameraSpinner( ) {
    var ph = $( "figure > .icon" );
    ph.setStyle( "background", "url(img/icon-photo.png) no-repeat scroll center center" );
    return false;
  }

  /**
   * Remove the picture from the dom
   */
  function onRemovePhoto( ) {
    Params.attachment_data = false;
    hideFeedback( );
    var image = document.getElementById( "photo-holder" );
    image.innerHTML = "";
    removeCameraSpinner( );
  }

  /**
   * If we could not get picture from library / gallery
   */
  function libraryError( ) {
    removeCameraSpinner( );
  }

  /**
   * When camera dialog closes
   */
  function onCameraFeedbackClose( ) {
    hideFeedback( );
    removeCameraSpinner( );
  }

  /**
   * Adds picture to the params attachment data
   * @param: {Object} fileURI
   */
  function pictureSuccess( fileURI ) {
    Params.attachment_data = fileURI;

    addPhotoToDom( );
    removeCameraSpinner( );
  }

  /**
   * Failed to get picture
   * @param: {Object} e
   */
  function cameraError( e ) {
    removeCameraSpinner( );
  }

  /**
   * Camera Options
   * @param: {Object} t
   */
  function getCameraOptions( t ) {
    return {
      quality: 40,
      destinationType: navigator.camera.DestinationType.FILE_URI,
      sourceType: t,
      allowEdit: false,
      encodingType: navigator.camera.EncodingType.JPEG,
      targetWidth: 800,
      targetHeight: 800
    };
  }

  /**
   * Show camera
   */
  function onChooseCamera( ) {
    navigator.camera.getPicture( pictureSuccess, cameraError, getCameraOptions( navigator.camera.PictureSourceType.CAMERA ) );
    hideFeedback( );
  }

  /**
   * Show library / gallery
   */
  function onChooseLibrary( ) {
    navigator.camera.getPicture( pictureSuccess, libraryError, getCameraOptions( navigator.camera.PictureSourceType.PHOTOLIBRARY ) );
    hideFeedback( );
  }

  /**
   * Show dialog for options
   */
  function onAddPhoto( ) {
    var a, b, c, d;
    addCameraSpinner( );
    if ( !Params.attachment_data ) {
      updateFeedbackButtons( Templates.camera1 );
    } else {
      updateFeedbackButtons( Templates.camera2 );
    }

    showFeedback( );
    a = new coc.ui.FastButton( document.getElementById( "choose-camera" ), onChooseCamera );
    b = new coc.ui.FastButton( document.getElementById( "choose-library" ), onChooseLibrary );
    c = new coc.ui.FastButton( document.getElementById( "feedback-close" ), onCameraFeedbackClose );
    if ( Params.attachment_data ) {
      d = new coc.ui.FastButton( document.getElementById( "remove-photo" ), onRemovePhoto );
    }
  }

  /**
   * Make and set the map on the dom
   */
  function setMap( ) {
    var pos, m;
    m = document.getElementById( 'map' );
    if ( m ) {
      pos = new google.maps.LatLng( Params.location_latitude, Params.location_longitude );
      activeMap = new google.maps.Map( m, {
        zoom: 18,
        center: pos,
        streetViewControl: false,
        disableDefaultUI: true,
        zoomControl: true,
        zoomControlOptions: {
          style: google.maps.ZoomControlStyle.DEFAULT,
          position: google.maps.ControlPosition.TOP_LEFT
        },
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: google.maps.MapTypeControlStyle.DEFAULT,
          position: google.maps.ControlPosition.TOP_RIGHT
        },
        keyboardShortcuts: false,
        scrollwheel: false,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      } );
      google.maps.event.addListener( activeMap, 'dragend', onMapDragEnd );
      if ( !geocoder ) {
        geocoder = new google.maps.Geocoder( );
      }
      geocoder.geocode( {
        'latLng': pos
      }, onGeoCode );
      addMapEvents( );
    }
    return false;
  }

  /**
   * Find user position
   */
  function findPosition( ) {
    if ( Params.location_latitude && !Params.starting_new_ticket ) {
      setMap( );
      restorePhoto( );
    } else {
      if ( !locating ) {
        getNavigator( );

        // Unflag the user as starting a new ticket
        Params.starting_new_ticket = false;
      }
    }
    return false;
  }

  /**
   * Initialize map
   */
  function initMap( ) {
    geoAttempts = 1;
    try {
      positionMap( );
      findPosition( );
    } catch ( e ) {
      //map not there
    }
    return false;
  }

  function map( ) {
    hideFeedback( );
    setCurrentPage( "map", function ( ) {
      content.html( reg( Templates.map, "%text%", activeTitle + " (step 1 of 2)" ) );
      initMap( );

      if ( !tip_shown ) {
        navigator.notification.alert(
          'You can drag the map and zoom in or out with your fingers to adjust the location of your report as shown by the blue dot.',
          null,
          'Tip',
          "Close"
        );
      }
      tip_shown = true;

    } );
    return true;
  };

  /**
   * Report functions
   * @method: paramterize
   * @method: reportFailure
   * @method: reportSuccessWasDismissedWithIndex
   * @method: reportSuccess
   * @method: sendReportNoPhoto
   * @method: reportPhotoWin
   * @method: reportPhotoFail
   * @method: sendReportAndPhoto
   * @method: proccessMissed
   * @method: setParams
   * @method: onChangeLocation
   * @method: onCancelForm
   * @method: sendReport
   * @method: processForm
   * @method: onSubmitReport
   * @method: initReport
   * @method: showAddParams
   * @method: report
   * @method: showHideTrafficSignTypeOther
   * @method: showHideBikeRackDamage
   * @method: updateTrafficSignalList
   */

  /**
   * Convert evertying in params to URI params
   */
  function paramaterize( ) {
    var a = [ ],
      o;
    for ( o in Params ) {
      if ( Params.hasOwnProperty( o ) ) {
        a.push( o + '=' + encodeURIComponent( Params[ o ] ) || '' );
      }
    }

    return a.join( '&' );
  }

  /**
   * Report Failed
   * @param: {Object} t
   */
  function reportFailure( t ) {
    hideFeedback( );

    // if it's 3 try again
    navigator.notification.alert(
      t,
      null,
      "Alert",
      "Close"
    );

    return false;
  }

  /**
   * Report Success with Index
   * @param: {Int} index
   */
  function reportSuccessWasDismissedWithIndex( index ) {
    // Index is 1-based: 1 = NO, 2 = YES
    if ( index == 1 ) {
      // Go home
      $( "#report" ).fire( "click" );
    } else {
      // Go to status page
      $( "#status" ).fire( "click" );
    }
  }

  /**
   * Report Success
   * @param: {Object} t
   * @param: {String} ticketToken
   */
  function reportSuccess( t, ticketToken ) {
    var message = "";
    Params.attachment_data = false;
    hideFeedback( );

    if ( Number( t ) > 0 ) {
      message = "Your query has been submitted.";
    } else {
      message = t;
    }

    if ( getUserID( ) != "" ) {
      lastUnclaimedTicket = "";
      message += "\r\rWould you like to track the status of your report?";
    } else {
      lastUnclaimedTicket = ticketToken;
      message += "\r\rWould you like to register or log in to track the status of your report?";
    }

    navigator.notification.confirm(
      message,
      reportSuccessWasDismissedWithIndex,
      "Success", [ "No", "Yes" ]
    );

    return false;
  }

  /**
   * Send report with no photo
   */
  function sendReportNoPhoto( ) {
    server_timeout = setTimeout( abortXHR, server_timeout_limit );

    Params.device_id = getUserID( );

    server_xhr = content.xhr( wsAddresses.SubmitTicket, {
      async: true,
      method: 'post',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: paramaterize( ),
      error: function ( e ) {
        clearXHR( );
      },
      callback: function ( ) {

        clearXHR( );

        try {
          var r = JSON.parse( this.responseText );
          if ( r.success ) {
            reportSuccess( r.message, r.ticketToken );
          } else {
            reportFailure( r.message );
          }
        } catch ( e ) {
          hideFeedback( );
          // json not defined
        }
      }
    } );
    return false;
  }

  /**
   * Report with photo
   * @param: {Object} r
   */
  function reportPhotoWin( r ) {

    clearXHR( );

    try {
      var m = JSON.parse( unescape( r.response ) );

      if ( m.success )
        reportSuccess( m.message, m.ticketToken );
      else
        reportFailure( m.message );
    } catch ( e ) {
      reportFailure( r.response );
    }
  }

  /**
   * Report Failed with photo
   * @param: {Object} error
   */
  function reportPhotoFail( error ) {
    clearXHR( );
    hideFeedback( );

    navigator.notification.alert(
      "An error has occurred. Please try again. Error code: " + error.code,
      null,
      "Alert",
      "Close"
    );
  }

  /**
   * Send Report and Photo
   */
  function sendReportAndPhoto( ) {

    Params.device_id = getUserID( );

    server_timeout = setTimeout( abortXHR, server_timeout_limit );
    var options = new FileUploadOptions( ),
      ft = new FileTransfer( ),
      nfn;
    options.fileKey = "file";

    options.fileName = "pic.jpg";
    options.mimeType = "image/jpeg";
    options.chunkedMode = true;
    options.params = Params;

    if ( Params.attachment_data.indexOf( "?" ) > 0 ) {
      nfn = Params.attachment_data.substr( 0, Params.attachment_data.indexOf( "?" ) );
    } else {
      nfn = Params.attachment_data;
    }

    ft.upload( nfn, wsAddresses.SubmitTicket, reportPhotoWin, reportPhotoFail, options );

    return false;
  }

  /**
   * Ticket type: Missed curbside pickup
   * Get check box values
   */
  function processMissed( ) {
    var a = [ ],
      check1 = document.getElementById( "check1" ),
      check2 = document.getElementById( "check2" ),
      check3 = document.getElementById( "check3" ),
      check4 = document.getElementById( "check4" );
    if ( check1.checked ) {
      a.push( check1.value );
    }
    if ( check2.checked ) {
      a.push( check2.value );
    }
    if ( check3.checked ) {
      a.push( check3.value );
    }
    if ( check4.checked ) {
      a.push( check4.value );
    }
    return a.join( "," );
  }

  /**
   * Set values from the form the the params object
   */
  function setParams( ) {

    if ( window.localStorage ) {
      window.localStorage.setItem( "first_name", $( '#first_name' ).val( ) );
      window.localStorage.setItem( "last_name", $( '#last_name' ).val( ) );
      window.localStorage.setItem( "email_address", $( '#email_address' ).val( ) );
      window.localStorage.setItem( "phone_number", $( '#phone_number' ).val( ) );
    }

    Params.first_name = $( '#first_name' ).val( );
    Params.last_name = $( '#last_name' ).val( );
    Params.phone_number = $( '#phone_number' ).val( );
    Params.email_address = $( '#email_address' ).val( );
    Params.description = $( '#description' ).val( );
    // added
    Params.pole_number = $( '#pole_number' ).val( );
    Params.restaurant = $( '#restaurant' ).val( );
    Params.profanity = ( $( '#profanity' ).val( ) == "Yes" ) ? "Yes" : "";
    Params.missed = processMissed( );
    Params.collection_day = $( '#collection_day' ).val( );
    Params.traffic_signal_complaint_type = $( '#traffic_signal_complaint_type' ).val( );
    Params.traffic_signal_complaint = $( '#traffic_signal_complaint' ).val( );
    Params.bike_request_type = $( '#bike_request_type' ).val( );
    Params.bike_rack_type = $( '#bike_rack_type' ).val( );
    Params.bike_damage_type = $( '#bike_rack_damage_type' ).val( );
    Params.traffic_sign_type = $( '#traffic_sign_type' ).val( );
    Params.traffic_sign_type_other = $( '#traffic_sign_type_other' ).val( );
    Params.traffic_sign_complaint = $( '#traffic_sign_complaint' ).val( );
    Params.tree_maint_action = $( '#tree_maint_action' ).val( );
    Params.taxi_complaints_medallion_num = $( '#taxi_complaints_medallion_num_li' ).val( );
    Params.taxi_complaints_plate_num = $( '#taxi_complaints_plate_num_li' ).val( );
    Params.taxi_complaints_pickup_time = $( '#taxi_complaints_pickup_time_li' ).val( );
    Params.taxi_complaints_date = $( '#taxi_complaints_date_li' ).val( );
    Params.taxi_complaints_report_type = $( '#taxi_complaints_report_type_li' ).val( );

    return false;
  }

  /**
   * When the location gets changed
   */
  function onChangeLocation( ) {
    setParams( );
    map( );
  }

  /**
   * If the form was canceled show map
   */
  function onCancelForm( ) {
    map( );
    return true;
  }

  /**
   * Send report to the server
   */
  function sendReport( ) {

    var d = new Date( );
    var t = d.getTime( );

    if ( t - submitTime < 1000 ) {
      return;
    } else {
      submitTime = t;
    }

    if ( Params.attachment_data ) {
      updateFeedbackSpinner( "<p>Sending report. Pictures can take longer to transmit. Please wait...</p>" );
      showFeedback( );
      sendReportAndPhoto( );
    } else {
      updateFeedbackSpinner( "<p>Sending report. Please wait...</p>" );
      showFeedback( );
      sendReportNoPhoto( );
    }
    return false;
  }

  /**
   * Validate the form
   */
  function processForm( ) {
    // check for email or phone for rubbish if missedpickup
    if ( Params.request_type == ReportTypes.missedpickup ) {
      // check for an email or a phone
      if ( Params.phone_number.length == 0 && Params.email_address.length == 0 ) {
        navigator.notification.alert(
          "A phone number or email is required.",
          null,
          "Alert",
          "OK"
        );
      } else {
        if ( Params.email_address.length == 0 ) {
          sendReport( );
        } else {
          // check email
          var patt1 = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}/gi;
          if ( Params.email_address.match( patt1 ) ) {
            sendReport( );
          } else {
            navigator.notification.alert(
              "The email does not appear valid.",
              null,
              "Alert",
              "OK"
            );
          }
        }
      }
    } else {
      sendReport( );
    }
    return false;
  }

  /**
   * Submit the report
   * @param: {Object} e
   */
  function onSubmitReport( e ) {
    window.scrollTo( 0, 0 );
    setParams( );
    processForm( );
  }

  /**
   * Initialize the report
   */
  function initReport( ) {
    var a, b, c;
    a = new coc.ui.FastButton( document.getElementById( "submit-form" ), onSubmitReport );
    b = new coc.ui.FastButton( document.getElementById( "cancel-form" ), onCancelForm );
    c = new coc.ui.FastButton( document.getElementById( "change-location" ), chooseAddressMethod );

    submit_but = $( '#submit-form' );
    cancel_but = $( '#cancel-form' );

    if ( window.localStorage ) {
      Params.first_name = window.localStorage.getItem( "first_name" );
      Params.last_name = window.localStorage.getItem( "last_name" );
      Params.phone_number = window.localStorage.getItem( "phone_number" );
      Params.email_address = window.localStorage.getItem( "email_address" );

      $( '#first_name' ).val( Params.first_name );
      $( '#last_name' ).val( Params.last_name );
      $( '#phone_number' ).val( Params.phone_number );
      $( '#email_address' ).val( Params.email_address );
    }

    return false;
  }

  /**
   * Add report specific elements to the dom
   */
  function showAddParams( ) {
    switch ( Params.request_type ) {
      case ReportTypes.streetlight:
        $( "#pole_number_li" ).removeClass( "hidden" );
        break;
      case ReportTypes.rodent:
        $( "#restaurant_li" ).removeClass( "hidden" );
        break;
      case ReportTypes.graffiti:
        $( "#profanity_li" ).removeClass( "hidden" );
        break;
      case ReportTypes.missedpickup:
        $( "#missed_li" ).removeClass( "hidden" );
        $( "#collection_day_li" ).removeClass( "hidden" );
        break;
      case ReportTypes.trafficsignal:
        $( "#traffic_signal_complaint_type_li" ).removeClass( "hidden" );
        $( "#traffic_signal_complaint_li" ).removeClass( "hidden" );

        var ddl = document.getElementById( 'traffic_signal_complaint_type' );
        ddl.onchange = updateTrafficSignalList;

        updateTrafficSignalList( ddl.options[ ddl.selectedIndex ].value );
        break;
      case ReportTypes.bikerack:
        $( "#bike_rack_request_li" ).removeClass( "hidden" );
        $( "#bike_rack_type_li" ).removeClass( "hidden" );

        var ddl = document.getElementById( 'bike_request_type' );
        ddl.onchange = showHideBikeRackDamage;

        showHideBikeRackDamage( );
        break;
      case ReportTypes.trafficsign:
        $( "#traffic_sign_type_li" ).removeClass( "hidden" );
        $( "#traffic_sign_complaint_li" ).removeClass( "hidden" );

        var ddl = document.getElementById( 'traffic_sign_type' );
        ddl.onchange = showHideTrafficSignTypeOther;

        showHideTrafficSignTypeOther( );
        break;
      case ReportTypes.treemaintenance:
        $( "#tree_maint_action_li" ).removeClass( "hidden" );
        break;
      case ReportTypes.taxicomplaint:
        $( '#taxi_complaints_medallion_num_li' ).removeClass( "hidden" );
        $( '#taxi_complaints_plate_num_li' ).removeClass( "hidden" );
        $( '#taxi_complaints_pickup_time_li' ).removeClass( "hidden" );
        $( '#taxi_complaints_date_li' ).removeClass( "hidden" );
        $( '#taxi_complaints_report_type_li' ).removeClass( "hidden" );
        break;
    }
    return false;
  }

  function report( ) {
    hideFeedback( );
    setCurrentPage( "report", function ( ) {
      var t = [ "%text%", "%address%" ],
        v = [ activeTitle + " (step 2 of 2)", Params.location_streetNum + " " + Params.location_streetName ];
      content.html( reg2( Templates.report, t, v ) );
      showAddParams( );
      initReport( );
    } );
    return true;
  };

  function showHideTrafficSignTypeOther( ) {
    var ddl = document.getElementById( 'traffic_sign_type' );
    var type = ddl.options[ ddl.selectedIndex ].value;

    if ( type == 'Other' )
      $( "#traffic_sign_type_other_li" ).removeClass( "hidden" );
    else
      $( "#traffic_sign_type_other_li" ).addClass( "hidden" );
  }

  function showHideBikeRackDamage( ) {
    var ddl = document.getElementById( 'bike_request_type' );
    var request = ddl.options[ ddl.selectedIndex ].value;

    if ( request == 'Repair damaged rack' )
      $( "#bike_rack_damage_type_li" ).removeClass( "hidden" );
    else
      $( "#bike_rack_damage_type_li" ).addClass( "hidden" );
  }

  function updateTrafficSignalList( ) {
    var ddl = document.getElementById( 'traffic_signal_complaint_type' );
    var type = ddl.options[ ddl.selectedIndex ].value;
    switch ( type ) {
      case "General":
        $( "#traffic_signal_complaint" ).html( "<option>Pedestrian lamp is not working</option><option>red/yellow/green not working</option><option>Signal is facing the wrong direction</option><option>School zone flasher not working</option>" );
        break;
      case "Driving":
        $( "#traffic_signal_complaint" ).html( "<option>Green light is too short</option><option>Green light never comes on</option><option>Signals not coordinated</option><option>Traffic blocking intersection</option>" );
        break;
      case "Walking":
        $( "#traffic_signal_complaint" ).html( "<option>Not enough time to cross street</option><option>Vehicles are running the red light</option><option>Vehicles are turning right on red</option><option>WALK light is on but vehicles are turning</option><option>WALK light never comes on</option><option>Push-button is missing</option><option>WALK light takes too long to come on</option>" );
        break;
      case "Cycling":
        $( "#traffic_signal_complaint" ).html( "<option value='Signal is not detecting my bike'>Signal is not detecting my bike</option><option value='Vehicles are running red light'>Vehicles are running red light</option>" );
        break;
      default:
        break;
    }
  }

  /**
   * Address functions
   * @method: setAddress
   * @method: addressSuccess
   * @method: addressFailure
   * @method: onSubmitAddress
   * @method: onCancelAddress
   * @method: initAddress
   */

  /**
   * Set address to the paramaters
   * @param: {Int} num
   * @param: {String} name
   */
  function setAddress( num, name ) {
    Params.location_streetNum = num;
    Params.location_streetName = name;
    Params.location_city = 'Cambridge';
    Params.location_zipcode = '';
    Params.location_latitude = '';
    Params.location_longitude = '';
    report( );
  }

  /**
   * If address was in cambridge and matched
   * @param: {Object} o
   */
  function addressSuccess( o ) {

    document.getElementById( "change-street-number" ).blur( );
    document.getElementById( "change-street-name" ).blur( );

    hideFeedback( );
    var matches = o.matches,
      i = 0,
      l = matches.length,
      html = '';
    if ( matches.length > 0 ) {
      if ( matches.length == 1 ) {
        setAddress( matches[ 0 ].Address.StreetNumber, matches[ 0 ].Address.StreetName );
      } else {
        matchesList.html( "" );
        while ( i < l ) {
          html += "<a id='" + i + "' class='matches'>" + matches[ i ].Address.StreetNumber + " " + matches[ i ].Address.StreetName + "</a><br/><br/>";
          i = i + 1;
        }
        matchesList.html( "An exact match could not be found. Did you mean:<br/><br/>" + html );
        $( ".matches" ).click( function ( e ) {
          var id = $( e.currentTarget ).attr( "id" ),
            match = matches[ Number( id ) ];

          setAddress( match.Address.StreetNumber, match.Address.StreetName );
        } );
      }
    } else {
      navigator.notification.alert(
        "The address you specified is invalid. Please try another.",
        null,
        "Alert",
        "Close"
      );
    }

    return false;
  }

  /**
   * Failed to find address
   * @param: {String} t
   */
  function addressFailure( t ) {
    hideFeedback( );
    navigator.notification.alert(
      t,
      null,
      "Alert",
      "Close"
    );

    return false;
  }

  /**
   * Submitting the address to the server
   * @param: {Object} e
   */
  function onSubmitAddress( e ) {
    window.scrollTo( 0, 0 );
    if ( change_street_number.val( ).length > 0 && change_street_name.val( ).length > 0 ) {
      updateFeedbackSpinner( "<p>Validating address, please wait…</p>" );
      showFeedback( );
      server_timeout = setTimeout( abortXHR, server_timeout_limit );
      server_xhr = content.xhr( wsAddresses.ValidateAddress, {
        async: true,
        method: 'post',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: 'location_streetNum=' + encodeURIComponent( change_street_number.val( ) ) + '&location_streetName=' + encodeURIComponent( change_street_name.val( ) ),
        error: function ( ) {
          clearXHR( );
        },
        callback: function ( ) {

          clearXHR( );
          try {
            var r = JSON.parse( this.responseText );
            if ( r.success ) {
              addressSuccess( r );
            } else {
              addressFailure( r.message );
            }
          } catch ( e ) {
            hideFeedback( );
          }
        }
      } );
    } else {
      navigator.notification.alert(
        "You must provide a street number and a street name.",
        null,
        "Alert",
        "Close"
      );
    }
    return true;
  }

  /**
   * Cancel address lookup
   * @param: {Object} e
   */
  function onCancelAddress( e ) {
    report( );
    return true;
  }

  /**
   * Initialize address in dom
   */
  function initAddress( ) {
    var a, b;
    a = new coc.ui.FastButton( document.getElementById( "submit-address" ), onSubmitAddress );
    b = new coc.ui.FastButton( document.getElementById( "cancel-address" ), onCancelAddress );

    change_street_number = $( "#change-street-number" );
    change_street_name = $( "#change-street-name" );
    matchesList = $( "#matches-list" );

  }

  function address( ) {
    hideFeedback( );
    setCurrentPage( "address", function ( ) {
      var t = [ "%text%" ],
        v = [ activeTitle + " (step 2 of 2)" ];
      content.html( reg2( Templates.address, t, v ) );
      initAddress( );
    } );
    return true;
  };

  /**
   * Home page functions
   * @method: setHelpBlurb
   * @method: initIndex
   * @method: index
   */

  /**
   * Set text in the help blurb based on the dropdown select
   */
  function setHelpBlurb( ) {
    var selectedIndex, helpBlurbsList;

    $( "#report-list ul" ).find( "li" ).removeClass( "selected-help" );

    selectedIndex = $( "#report-list" )[ 0 ].options.selectedIndex;
    helpBlurbsList = document.getElementById( "help-blurbs" ).children[ 0 ];

    if ( selectedIndex > 0 ) {
      $( helpBlurbsList.children[ selectedIndex - 1 ] ).addClass( "selected-help" );
    }
  }

  /**
   * Set page to the index (Home page)
   */
  function initIndex( ) {
    var a;

    a = new coc.ui.FastButton( document.getElementById( "report-list-confirm" ), prepareMap );

    document.getElementById( "report-list" ).onchange = function ( ) {
      setHelpBlurb( );
    };
    setHelpBlurb( );

    return false;
  }

  function index( ) {
    setCurrentPage( "index", function ( ) {
      content.html( Templates.index );
      initIndex( );
    } );

    // Get latest messages from the server.
    server_xhr = content.xhr( wsAddresses.GetNotifications, {
      async: true,
      method: 'GET',
      headers: {
        "Cache-Control": "no-cache"
      },
      error: function ( e ) {
        clearXHR( );
      },
      callback: function ( ) {

        clearXHR( );
        try {
          var r = JSON.parse( this.responseText );
          var alreadySeenID = window.localStorage.getItem( "messageID" ) ? window.localStorage.getItem( "messageID" ) : 0;
          var seen = false;
          for ( var index = 0; index < r.length; index++ ) {
            if ( parseFloat(r[index].targetVersion) == parseFloat(appVersion) ) {
              if ( r[index].messageID > alreadySeenID && !seen) {
                navigator.notification.alert( r[index].messageText, null, r[index].messageTitle );
                window.localStorage.setItem( "messageID", r[index].messageID );
                seen = true;
              }
            }
            else {
              switch(r[index].targetVersion.substring(0,1)) {
                case "<":
                  if( parseFloat(appVersion) < parseFloat(r[index].targetVersion.substring(1, r[index].targetVersion.length)) ) {
                    if ( r[index].messageID > alreadySeenID && !seen) {
                      navigator.notification.alert( r[index].messageText, null, r[index].messageTitle );
                      window.localStorage.setItem( "messageID", r[index].messageID );
                      seen = true;
                    }
                  }
                  break;
                case ">":
                  if( parseFloat(appVersion) > parseFloat(r[index].targetVersion.substring(1, r[index].targetVersion.length)) ) {
                    if ( r[index].messageID > alreadySeenID && !seen) {
                      navigator.notification.alert( r[index].messageText, null, r[index].messageTitle );
                      window.localStorage.setItem( "messageID", r[index].messageID );
                      seen = true;
                    }
                  }
                  break;
                default:
                  console.log("Nothing found");
                  break;
              }
            }
          }
        } catch ( e ) {
          console.log(e);
        }
      }
    } );

    return true;
  };

  /**
   * Tab functions
   * @method: switchTabs
   * @method: setActivity
   * @method: makeTabs
   * @method: tabs
   */

  /**
   * Added selected css tag to active tab item
   * @param: {Object} item
   */
  function switchTabs( item ) {
    activeTab.removeClass( "selected" );
    activeTab = item;
    activeTab.addClass( "selected" );

    return false;
  }

  /**
   * Change tabs
   * @param: {Object} e
   */
  function setActivity( e ) {
    var item = $( e.currentTarget ),
      id = String( item.attr( "id" ) );
    switchTabs( item );
    switch ( id ) {
      case "report":
        index( );
        break;
      case "status":
        status( );
        break;
      case "help":
        help( );
        break;
    }
  }

  /**
   * Set tab text
   */
  function makeTabs( ) {
    var a, b, c;

    a = new coc.ui.FastButton( document.getElementById( "report" ), setActivity );
    b = new coc.ui.FastButton( document.getElementById( "status" ), setActivity );
    c = new coc.ui.FastButton( document.getElementById( "help" ), setActivity );

    return false;
  }

  function tabs( ) {
    header.html( Templates.tabs );
    makeTabs( );

    return false;
  };

  /**
   * Adds active class to the element
   * @param: {HTMLElement} element
   * @param: {Object} handler
   */
  function addTouch( element, handler ) {

    element.on( "touchstart", function ( e ) {
      $( e.currentTarget ).addClass( "active" );
    } );

    element.on( "touchend", function ( e ) {
      var t = $( e.currentTarget );
      t.removeClass( "active" );
      event.stopPropagation( );
      event.preventDefault( );
      t.un( "touchend" );
      handler( e );
    } );

    return element;

  }

  /**
   * FastButton functions
   */
  coc.ui = {};
  coc.clickbuster = {};

  coc.ui.FastButton = function ( element, handler ) {
    this.element = element;
    this.handler = handler;

    element.addEventListener( "touchstart", this, false );
    element.addEventListener( "click", this, false );
  };

  coc.ui.FastButton.prototype.handleEvent = function ( event ) {
    $( this.element ).addClass( "active" );
    switch ( event.type ) {
      case "touchstart":
        this.onTouchStart( event );
        break;
      case "touchmove":
        this.onTouchMove( event );
        break;
      case "touchend":
        this.onClick( event );
        break;
      case "click":
        this.onClick( event );
        break;
    }
  };

  coc.ui.FastButton.prototype.onTouchStart = function ( event ) {
    event.stopPropagation( );

    this.element.addEventListener( "touchend", this, false );
    document.body.addEventListener( "touchmove", this, false );

    this.startX = event.touches[ 0 ].clientX;
    this.startY = event.touches[ 0 ].clientY;
  };

  coc.ui.FastButton.prototype.onTouchMove = function ( event ) {
    if ( Math.abs( event.touches[ 0 ].clientX - this.startX ) > 10 ||
      Math.abs( event.touches[ 0 ].clientY - this.startY ) > 10 ) {
      this.reset( );
    }
  };

  coc.ui.FastButton.prototype.onClick = function ( event ) {
    event.stopPropagation( );

    this.reset( );
    this.handler( event );

    if ( event.type == "touchend" ) {
      coc.clickbuster.preventGhostClick( this.startX, this.startY );
    }
  };

  coc.ui.FastButton.prototype.reset = function ( ) {
    $( this.element ).removeClass( "active" );
    this.element.removeEventListener( "touchend", this, false );
    document.body.removeEventListener( "touchmove", this, false );
  };

  /**
   * The foloowing clickbusters prevent items from double clicking / ghost clicking
   * @method: preventGhostClick
   * @method: pop
   * @method: onClick
   */
  coc.clickbuster.preventGhostClick = function ( x, y ) {
    coc.clickbuster.coordinates.push( x, y );
    window.setTimeout( coc.clickbuster.pop, 2500 );
  };

  coc.clickbuster.pop = function ( ) {
    coc.clickbuster.coordinates.splice( 0, 2 );
  };

  coc.clickbuster.onClick = function ( event ) {
    for ( var i = 0; i < coc.clickbuster.coordinates.length; i += 2 ) {
      var x = coc.clickbuster.coordinates[ i ];
      var y = coc.clickbuster.coordinates[ i + 1 ];

      if ( Math.abs( event.clientX - x ) < 25 && Math.abs( event.clientY - y ) < 25 ) {
        event.stopPropagation( );
        event.preventDefault( );
      }
    }
  };

  /**
   * ONLY for Android, Back key pressed function
   */
  function onBackKey( ) {
    switch ( currentPage ) {
      case 'index':
        device.exitApp( );
        break;
      case 'map':
        index( );
        break;
      case 'report':
        map( );
        break;
      case 'address':
        report( );
        break;
      case 'help':
        index( );
        switchTabs( $( "#report" ) );
        break;
      case 'status':
        index( );
        switchTabs( $( "#report" ) );
        break;
    }
  }

  /**
   * App Initialization functions
   */

  function begin( ) {
    tabs( );
    activeTab = $( ".selected" );

    index( );

    windowHeight = window.innerHeight;

    return false;
  }

  function mapsLoaded( ) {
    content = $( "#content" );
    header = $( "#header" );
    feedback = $( "#feedback" );
    hider = $( "#hider" );

    signup = $( "#signup" );
    login = $( "#login" );
    initAuthentication( );

    begin( );
  }

  function loadGoogleMaps( ) {
    // set to maps loaded for deploy
    googleCallback = mapsLoaded;
    try {
      var scriptTag = document.createElement( "script" );
      scriptTag.type = "text/javascript";
      scriptTag.src = "http://maps.google.com/maps/api/js?sensor=true&callback=googleCallback";
      document.getElementsByTagName( "head" )[ 0 ].appendChild( scriptTag );
    } catch ( e ) {
      navigator.notification.alert(
        "Maps failed to load please restart the App.",
        null,
        "Alert",
        "OK"
      );
    }
  }

  function run( ) {

    try {
      Params.device_id = getUserID( );
      Params.platform = device.platform || "iPhone";
      Params.appVersion = appVersion;
    } catch ( e ) {

    }

    // init button objects
    document.addEventListener( "click", coc.clickbuster.onClick, true );
    coc.clickbuster.coordinates = [ ];

    // lifecycle events
    try {
      document.addEventListener( "backbutton", onBackKey, true );
    } catch ( e ) {
    }

    loadGoogleMaps( );

    return false;
  }

  init = function ( ) {
    document.addEventListener( 'deviceready', run, false );

    return false;
  };

}( ) );
