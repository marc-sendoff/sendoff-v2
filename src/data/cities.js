/* US origin cities — free-text also accepted */
export const CITIES = {
  Miami: [25.76, -80.19], Orlando: [28.54, -81.38], Tampa: [27.95, -82.46], Jacksonville: [30.33, -81.66],
  Atlanta: [33.75, -84.39], "New York": [40.71, -74.01], Boston: [42.36, -71.06], Philadelphia: [39.95, -75.17],
  "Washington DC": [38.91, -77.04], Chicago: [41.88, -87.63], Detroit: [42.33, -83.05], Minneapolis: [44.98, -93.27],
  Dallas: [32.78, -96.8], Houston: [29.76, -95.37], Austin: [30.27, -97.74], "San Antonio": [29.42, -98.49],
  Phoenix: [33.45, -112.07], "Las Vegas": [36.17, -115.14], "Los Angeles": [34.05, -118.24], "San Diego": [32.72, -117.16],
  "San Francisco": [37.77, -122.42], Seattle: [47.61, -122.33], Portland: [45.52, -122.68], Denver: [39.74, -104.99],
  "Salt Lake City": [40.76, -111.89], Nashville: [36.16, -86.78], Charlotte: [35.23, -80.84], Raleigh: [35.78, -78.64],
  "New Orleans": [29.95, -90.07], "Kansas City": [39.1, -94.58], "St. Louis": [38.63, -90.2], Columbus: [39.96, -83.0],
  Cleveland: [41.5, -81.69], Pittsburgh: [40.44, -79.99], Baltimore: [39.29, -76.61], Indianapolis: [39.77, -86.16],
  Milwaukee: [43.04, -87.91], Memphis: [35.15, -90.05], Albuquerque: [35.08, -106.65], Boise: [43.62, -116.2],
  // — Florida & Southeast
  "Fort Lauderdale": [26.12, -80.14], "West Palm Beach": [26.71, -80.05], "Fort Myers": [26.64, -81.87],
  Sarasota: [27.34, -82.53], Pensacola: [30.42, -87.22], Savannah: [32.08, -81.09], Charleston: [32.78, -79.93],
  "Myrtle Beach": [33.69, -78.89], Birmingham: [33.52, -86.81], Huntsville: [34.73, -86.59],
  Knoxville: [35.96, -83.92], Chattanooga: [35.05, -85.31], Louisville: [38.25, -85.76], Lexington: [38.04, -84.5],
  "Jackson MS": [32.3, -90.18],
  // — Mid-Atlantic & Northeast
  Richmond: [37.54, -77.44], Norfolk: [36.85, -76.29], "Virginia Beach": [36.85, -75.98], Newark: [40.74, -74.17],
  Buffalo: [42.89, -78.88], Rochester: [43.16, -77.61], Syracuse: [43.05, -76.15], Albany: [42.65, -73.76],
  Hartford: [41.77, -72.67], Providence: [41.82, -71.41], "Burlington VT": [44.48, -73.21], "Portland ME": [43.66, -70.26],
  // — Midwest & Plains
  Cincinnati: [39.1, -84.51], "Grand Rapids": [42.96, -85.67], Madison: [43.07, -89.4], Omaha: [41.26, -95.93],
  "Des Moines": [41.59, -93.62], Wichita: [37.69, -97.33], Fargo: [46.88, -96.79], "Sioux Falls": [43.54, -96.73],
  "Rapid City": [44.08, -103.23],
  // — South Central
  "Little Rock": [34.75, -92.29], "Oklahoma City": [35.47, -97.52], Tulsa: [36.15, -95.99],
  "El Paso": [31.76, -106.49], Lubbock: [33.58, -101.86], Amarillo: [35.22, -101.83],
  // — Mountain West
  "Santa Fe": [35.69, -105.94], "Colorado Springs": [38.83, -104.82], Tucson: [32.22, -110.97],
  Billings: [45.78, -108.5], Bozeman: [45.68, -111.04], Missoula: [46.87, -113.99], "Jackson Hole": [43.48, -110.76],
  Reno: [39.53, -119.81],
  // — West Coast & Pacific
  Sacramento: [38.58, -121.49], "San Jose": [37.34, -121.89], Oakland: [37.8, -122.27], Fresno: [36.74, -119.79],
  Burbank: [34.18, -118.31], "Long Beach": [33.77, -118.19], "Ontario CA": [34.06, -117.65],
  "Palm Springs": [33.83, -116.55], "Santa Barbara": [34.42, -119.7], Spokane: [47.66, -117.43], Eugene: [44.05, -123.09],
  // — Alaska & Hawaii
  Anchorage: [61.22, -149.9], Honolulu: [21.31, -157.86], "Maui (Kahului)": [20.89, -156.47],
};

/* Home-airport codes for origin cities — used to build flight links */
export const AIRPORTS = {
  Miami:"MIA", Orlando:"MCO", Tampa:"TPA", Jacksonville:"JAX", Atlanta:"ATL", "New York":"NYC",
  Boston:"BOS", Philadelphia:"PHL", "Washington DC":"WAS", Chicago:"CHI", Detroit:"DTW",
  Minneapolis:"MSP", Dallas:"DFW", Houston:"HOU", Austin:"AUS", "San Antonio":"SAT", Phoenix:"PHX",
  "Las Vegas":"LAS", "Los Angeles":"LAX", "San Diego":"SAN", "San Francisco":"SFO", Seattle:"SEA",
  Portland:"PDX", Denver:"DEN", "Salt Lake City":"SLC", Nashville:"BNA", Charlotte:"CLT",
  Raleigh:"RDU", "New Orleans":"MSY", "Kansas City":"MCI", "St. Louis":"STL", Columbus:"CMH",
  Cleveland:"CLE", Pittsburgh:"PIT", Baltimore:"BWI", Indianapolis:"IND", Milwaukee:"MKE",
  Memphis:"MEM", Albuquerque:"ABQ", Boise:"BOI",
  // — Florida & Southeast
  "Fort Lauderdale":"FLL", "West Palm Beach":"PBI", "Fort Myers":"RSW", Sarasota:"SRQ", Pensacola:"PNS",
  Savannah:"SAV", Charleston:"CHS", "Myrtle Beach":"MYR", Birmingham:"BHM", Huntsville:"HSV",
  Knoxville:"TYS", Chattanooga:"CHA", Louisville:"SDF", Lexington:"LEX", "Jackson MS":"JAN",
  // — Mid-Atlantic & Northeast
  Richmond:"RIC", Norfolk:"ORF", "Virginia Beach":"ORF", Newark:"EWR", Buffalo:"BUF", Rochester:"ROC",
  Syracuse:"SYR", Albany:"ALB", Hartford:"BDL", Providence:"PVD", "Burlington VT":"BTV", "Portland ME":"PWM",
  // — Midwest & Plains
  Cincinnati:"CVG", "Grand Rapids":"GRR", Madison:"MSN", Omaha:"OMA", "Des Moines":"DSM", Wichita:"ICT",
  Fargo:"FAR", "Sioux Falls":"FSD", "Rapid City":"RAP",
  // — South Central
  "Little Rock":"LIT", "Oklahoma City":"OKC", Tulsa:"TUL", "El Paso":"ELP", Lubbock:"LBB", Amarillo:"AMA",
  // — Mountain West
  "Santa Fe":"SAF", "Colorado Springs":"COS", Tucson:"TUS", Billings:"BIL", Bozeman:"BZN", Missoula:"MSO",
  "Jackson Hole":"JAC", Reno:"RNO",
  // — West Coast & Pacific
  Sacramento:"SMF", "San Jose":"SJC", Oakland:"OAK", Fresno:"FAT", Burbank:"BUR", "Long Beach":"LGB",
  "Ontario CA":"ONT", "Palm Springs":"PSP", "Santa Barbara":"SBA", Spokane:"GEG", Eugene:"EUG",
  // — Alaska & Hawaii
  Anchorage:"ANC", Honolulu:"HNL", "Maui (Kahului)":"OGG",
};

/* Worldwide origins (generated, see scripts/build-world-cities.mjs): 990+
   non-US metros with a large scheduled airport. Names carry the country
   ("London, United Kingdom") so they never shadow the curated US list above.
   Merged into the same two maps so every consumer (picker, globe, flight
   links, the nightly puller's origin list) gets them with zero code changes. */
import { WORLD_CITIES } from "./world-cities.js";
export { WORLD_CITIES };
for (const w of WORLD_CITIES) {
  if (w.name in CITIES) continue; // curated entry wins
  CITIES[w.name] = [w.lat, w.lon];
  AIRPORTS[w.name] = w.code;
}
