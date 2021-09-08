'use strict';

//Define functions here (starts with main function)
function main(){

  //USE COOKIES -> limit number of calls to the API, have other pages update accordingly
  if(document.cookie.length != 0){
    updateSiteColors(getCookieData());
  }

  //Button functionality, make button a react element, call function onClick
  //with button click, react gets rid of button/text and calls function to find user geolocation
  //updates color scheme and text of card accordingly

  //If it isn't "undefined" and it isn't "null", then it exists.
  if(typeof(document.getElementById("WithButton")) != 'undefined' && document.getElementById("WithButton") != null){
      ReactDOM.render(React.createElement(TheButton), document.querySelector('#WithButton'));
  }

}

//----------------------------------------------------------------------------------------\\

//Funtions to update HTML, starts with ones that update card and header colors
function updateCardColors(color){
  for(let item of document.getElementsByClassName("card")){
    item.className = ("card " + color + " mb-3");
  }
  for(let item of document.getElementsByClassName("list-group-item")){
    item.className = ("list-group-item " + color);
  }
  return true;
}

function updateHeader(daytime){
  let navbar = document.getElementById("Navbar");
  navbar.className = "navbar fixed-top navbar-expand-lg " + (daytime ? "navbar-light bg-light" : "navbar-dark bg-dark");
  return true;
}

//Takes cookies as a dict object and updates site header/cards accordingly
//Uses previous two functions
function updateSiteColors(cookieDictionary){
  //First, make sure you have the right info

  if(badCookieData(cookieDictionary)){
    console.error("Bad cookie data - stopping here");
    return false;
  }

  //Weather api will return thunderstorm, [drizzle, rain], snow, clear, clouds, [fog, haze = clouds], [mist = rain]
  //Create a dictionary with the different card colors
  const colorDict = {
    Green: "text-white bg-success",
    White: "bg-light",
    Black: "text-white bg-dark",
    Clear: "bg-secondary",
    Blue: "text-white bg-primary",
    LightBlue: "text-white bg-info",
    Yellow: "text-white bg-warning"
  }

  //Clouds should only be for heavy clouds [broken/overcast clouds -> neeeds to be hardcoded in]
  const apiRef = {
    //default: 'Green',
    default: 'White',
    drizzle : 'Blue',
    mist: 'Blue',
    rain: 'Blue',
    snow: 'LightBlue',
    clouds: 'Clear',
    fog: 'Clear',
    haze: 'Clear',
    thunderstorm: 'Yellow',
    clear: 'Black'
  }

  const currTime = parseInt(new Date().getTime()/ 1000);

  let isDaytime = (currTime > cookieDictionary.sunrise && currTime < cookieDictionary.sunset);


  //Update the header and then update the update the cards
  updateHeader(isDaytime);

  //Check cloud cloud cover
  if(parseInt(cookieDictionary.cloudpct) < 50){
    cookieDictionary.condition = "clear";
  }

  if(isDaytime  && cookieDictionary.condition == "clear"){
    updateCardColors(colorDict.White);
  } else {
    updateCardColors(colorDict[apiRef[cookieDictionary.condition]]);
  }

  return true;
}

//----------------------------------------------------------------------------------------\\

//Cookie related functions, this includes get set and check

//Returns cookies stored in browser. If no cookies are stored returns null
//If cookies found: returns dict with
function setCookie(key, value){
  document.cookie= String(key) + "=" + String(value).toLowerCase() + "; path=/";
}

//Returns dict object with data from the site cookies or null
function getCookieData(){
  //Make sure something is here
  if(document.cookie.length == 0){
    return null;
  }
  //This will store the cookies
  let oven = {};
  for(let cookie of document.cookie.split(';')){
    let kv = cookie.split('=')
    oven[kv[0].trim()] = kv[1].trim();
  }
  return oven;
}

function badCookieData(cookieDictionary){
  if(cookieDictionary === null){
    return true;
  }
  for(let key in cookieDictionary){
    if(!key){
      return true;
    }
  }

  return false;
}

//----------------------------------------------------------------------------------------\\

//This method is just a container for location/api functions listed below
function callGeoGetter(){
  if (navigator.geolocation) {
    return new Promise((a, b) => {
        navigator.geolocation.getCurrentPosition(a, b);
    });
  }
  return false;
}

//Callback function for when geodata is used
async function makeAPICall(){
  console.log("Calling API")
  //This method only runs if document.cookie.length == 0
  //That means you need to get data and make an api call

  var pos;
  try{
    pos = await callGeoGetter();
  } catch(error){
    console.error("Couldn't get location");
    return false;
  }

  let lat = pos.coords.latitude;
  let lon = pos.coords.longitude;
  let url = "https://fcc-weather-api.glitch.me/api/current?lat=" + lat + "&lon=" + lon;

  //What to store from api?
  //condition, sunset, sunrise, clouds%, town, temp
  let response = await fetch(url);
  if(response.ok){
    let data = await response.json();

    setCookie("condition", data.weather[0].main);
    setCookie("sunrise", data.sys.sunrise);
    setCookie("sunset", data.sys.sunset);
    setCookie("cloudpct", data.clouds.all);
    setCookie("town", data.name);
    setCookie("temp", data.main.temp);

    //Cookies have been set, time to update the site
    //NOTE: checks have not been done on cookies
    return updateSiteColors(getCookieData())

  }else{
    console.alert("Couldn't get data");
    return false;
  }

}

function locationErr(err){
    console.error("Something went wrong my guy");
    return false;
}

//----------------------------------------------------------------------------------------\\

//Return a string for the condition
function getDescriptionData(){

  const currTime = parseInt(new Date().getTime()/ 1000);
  let cookieDictionary = getCookieData();

  let isDaytime = (currTime > cookieDictionary.sunrise && currTime < cookieDictionary.sunset);
  let dayNight = (isDaytime ? " today " : " tonight ");
  let cond = "";
  let temp = Math.round(parseFloat(cookieDictionary.temp) * 9/5 + 32);
  switch(cookieDictionary.condition) {
    case "drizzle":
    case "mist":
      // code block
      cond = "a little rainy";
      break;

    case "rain":
      cond = "rainy";
      break;

    case "snow":
      // code block
      cond = "snowy";
      break;

    case "thunderstorm":
      cond = "thunderstorming";
      break;

    case "clouds":
    case "fog":
    case "haze":
      cond = "cloudy";
      break;

    default:
      cond = "clear";
      //Clear condition
      // code block
  }

  return ("Thanks for sharing where you are. It appears to be " + cond + dayNight + "in " + cookieDictionary.town + " with a temperature of " + temp + " degrees.");
}

//----------------------------------------------------------------------------------------\\
//Add functionality for the Button
//Actually acts on the encompasing div though
//This is a react element
class TheButton extends React.Component{
  constructor(props) {
    super(props);
    this.state = { selected: false, hasData: false };
  }

  render() {
    //This only runs if user just pushed the button
    if (this.state.selected) {
      var InnerElement;
      //This means there was an error with the cookies
      if(!this.state.hasData){
        InnerElement = React.createElement('p',{className: "card-text"}, 'Something went wrong! Do you have location turned off?');
      //This means location/cookies all worked
      }else{
        InnerElement = React.createElement('p',{className: "card-text"}, getDescriptionData());
      }
      return React.createElement('div', null, InnerElement);
    }
    //This runs if there are already cookies with user data -> no button needed
    if(document.cookie.length != 0){
      InnerElement = React.createElement('p',{className: "card-text"}, getDescriptionData());
      return React.createElement('div', null, InnerElement);
    }
    //If nothing is known about the user, they are given the option to push the button
    return React.createElement('div', null,
        React.createElement('p',{className: "card-text"}, 'The style of this site can change based off of location\
        and current weather. Press the button below for the website to access your location and \
        store the data as a cookie.'),
        React.createElement('button',
        {
          className: "btn btn-outline-dark",
          onClick: () => { makeAPICall()
            .then(result => this.setState({selected: true, hasData: result}))
            .catch(error => this.setState({selected: true, hasData: false}));
          }
        },
        'Click Me!')
      );
    }
}

//Finally, call the main function!
main();
