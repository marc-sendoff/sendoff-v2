import json
T=[]
def t(id,name,tag,vibes,days,cost,img,fly,stay,stayName,city,lat,lon,blurb,hacks,plan,canDrive=True):
    T.append(dict(id=id,name=name,tag=tag,vibes=vibes,days=days,cost=cost,img=img,fly=fly,stay=stay,stayName=stayName,city=city,lat=lat,lon=lon,blurb=blurb,hacks=hacks,plan=plan,canDrive=canDrive))
t("virginiabeach","Virginia Beach","Three miles of boardwalk, zero plans",["beach","party"],3,290,"🌊","ORF","Virginia-Beach--VA","Virginia Beach","Virginia Beach, VA",36.85,-75.98,
  "The boardwalk runs three miles with a bike lane down the middle, the beach is wide enough for a whole group, and First Landing State Park is ten minutes away for the quiet day.",
  ["Stay in Oceanfront in the shoulder months (Sept, Oct, May) for half the summer rate","Rent bikes once and the whole boardwalk is yours"],
  ["Day 1 — Boardwalk, King Neptune, sunset on the pier","Day 2 — First Landing trails, then Chicks Beach for a quieter afternoon","Day 3 — Back Bay refuge, drive home"])
t("salem","Salem, MA","Witch trials, weird shops, a very good October",["culture","road"],2,260,"🧙","BOS","Salem--MA","Salem","Salem, MA",42.52,-70.9,
  "A 30-minute train from Boston into the 1692 witch trials, a Peabody Essex Museum that punches way above the town's size, and streets that go full Halloween all October.",
  ["Fly into Boston and take the commuter rail — parking in Salem in October is a myth","The Witch Trials Memorial is free and worth more than most of the paid 'museums'"],
  ["Day 1 — Witch House, the memorial, Peabody Essex, Pickering Wharf at night","Day 2 — Salem Willows, a Boston afternoon, fly home"])
t("richmond","Richmond, VA","Murals, the James, and a $4 beer",["culture","music","party"],3,300,"🎨","RIC","Richmond--VA","Richmond","Richmond, VA",37.54,-77.44,
  "Class-IV rapids run through the middle of downtown. Then there's a mural on every block, a Virginia Museum of Fine Arts that's free, and Carytown for the food.",
  ["The VMFA is free, every day","Belle Isle: walk out on the footbridge, swim the rocks, costs nothing"],
  ["Day 1 — Belle Isle, Carytown, Scott's Addition breweries","Day 2 — VMFA, the murals on Broad, a show at the National","Day 3 — Hollywood Cemetery views, fly home"])
t("raleigh","Raleigh + Durham","Two college towns, one cheap weekend",["culture","party","music"],3,280,"🎓","RDU","Raleigh--NC","Raleigh","Raleigh, NC",35.78,-78.64,
  "Raleigh for the free state museums and the bar strip on Glenwood, Durham for the Bull City food scene and the Duke campus, and both are 25 minutes apart.",
  ["Every state museum in Raleigh is free","Durham's Ninth Street and American Tobacco Campus are the night out"],
  ["Day 1 — Museums downtown, Glenwood South at night","Day 2 — Durham: Duke Chapel, Duke Gardens, Ninth Street","Day 3 — Umstead park walk, fly home"])
t("charlotte","Charlotte","Skyline brunch, NASCAR, cheap flights",["party","culture"],3,300,"🏁","CLT","Charlotte--NC","Charlotte","Charlotte, NC",35.23,-80.84,
  "It's a hub, so the flights are cheap from everywhere. Uptown has a rooftop for every night, South End has the breweries, and the NASCAR Hall is actually fun.",
  ["South End light rail stops are where the breweries cluster — no car needed","Whitewater Center day passes get you rafting, climbing and zip lines for one price"],
  ["Day 1 — Uptown, NASCAR Hall of Fame, rooftop sunset","Day 2 — U.S. National Whitewater Center all day","Day 3 — South End brunch, fly home"])
t("wrightsville","Wilmington + Wrightsville Beach","Riverwalk by day, surf at night",["beach","party"],3,310,"🏄","ILM","Wilmington--NC","Wilmington","Wilmington, NC",34.21,-77.8,
  "A downtown on the Cape Fear River with a mile-long riverwalk and a hundred bars, fifteen minutes from Wrightsville, the surf beach the whole state drives to.",
  ["Stay downtown, it's cheaper than the beach, and Wrightsville is a 15-minute ride","The Battleship North Carolina is $14 and takes a whole afternoon"],
  ["Day 1 — Riverwalk, the battleship, Front Street at night","Day 2 — Wrightsville Beach all day, Johnnie Mercer's pier","Day 3 — Airlie Gardens, fly home"])
t("hiltonhead","Hilton Head","Bike to the beach, golf if you must",["beach","nature"],3,360,"🚲","SAV","Hilton-Head-Island--SC","Hilton Head Island","Hilton Head Island, SC",32.22,-80.75,
  "Twelve miles of hard-packed beach you can bike on, a lighthouse at Harbour Town, and a whole island of paved bike trails under the live oaks. Fly into Savannah, 45 minutes away.",
  ["Rent bikes for the week, not the day — the whole island is flat and the trails go everywhere","Coligny Beach is the public one with free parking and the bars"],
  ["Day 1 — Coligny Beach, bike the trails, Harbour Town sunset","Day 2 — Kayak Broad Creek, Pinckney Island refuge","Day 3 — Dolphin boat, drive to Savannah, fly home"])
t("tybee","Tybee Island","Savannah's beach, 20 minutes out",["beach","party"],3,280,"🐢","SAV","Tybee-Island--GA","Tybee Island","Tybee Island, GA",32.0,-80.85,
  "The beach where Savannah goes on the weekend. A lighthouse, a pier, dolphin tours, and bars where you can still hear the ocean. Cheap because it's not trying.",
  ["Split the stay: two nights on Tybee, one in Savannah, both are 20 minutes apart","North Beach has the lighthouse and half the crowd of the pier end"],
  ["Day 1 — Tybee pier, the lighthouse, sunset on the back river","Day 2 — Kayak Little Tybee, Savannah at night","Day 3 — Forsyth Park breakfast, fly home"])
t("birmingham","Birmingham, AL","The civil rights trail, then the food",["culture","music"],2,230,"⚒️","BHM","Birmingham--AL","Birmingham","Birmingham, AL",33.52,-86.81,
  "The 16th Street Baptist Church, Kelly Ingram Park and the Civil Rights Institute are one block, and it'll stay with you. Then Avondale's bars and a food scene that keeps winning awards.",
  ["Civil Rights Institute: book the timed ticket, it sells out on weekends","Vulcan Park at night is the best free skyline view in the South"],
  ["Day 1 — Civil rights district, Railroad Park, Avondale at night","Day 2 — Vulcan Park, Sloss Furnaces, fly home"])
t("baltimore","Baltimore","Crab, the harbor, and Fells Point at night",["culture","party"],3,320,"🦀","BWI","Baltimore--MD","Baltimore","Baltimore, MD",39.29,-76.61,
  "The Inner Harbor is the postcard, Fells Point is the night, and the American Visionary Art Museum is the weirdest, best museum on the East Coast.",
  ["Fly Southwest or Spirit into BWI, it's one of the cheapest airports on the coast","Water taxi between the harbor neighborhoods beats a rideshare"],
  ["Day 1 — Inner Harbor, Visionary Art Museum, Federal Hill sunset","Day 2 — Fells Point, crab at a paper-covered table, Hampden","Day 3 — Fort McHenry, fly home"])
t("annapolis","Annapolis","Sailboats, oysters, a 1700s main street",["culture","beach"],2,260,"⛵","BWI","Annapolis--MD","Annapolis","Annapolis, MD",38.98,-76.49,
  "The Naval Academy, a harbor full of sailboats, and a main street that hasn't changed since the Revolution. Thirty minutes from BWI.",
  ["Watch the Naval Academy noon formation, it's free and it's a show","Take the water taxi to Eastport for the cheaper bars"],
  ["Day 1 — Naval Academy, Main Street, the City Dock at sunset","Day 2 — Sailing lesson or a schooner cruise, fly home"])
t("oceancity","Ocean City, MD","Ten miles of boardwalk, Thrasher's fries",["beach","party"],3,280,"🎡","SBY","Ocean-City--MD","Ocean City","Ocean City, MD",38.34,-75.08,
  "A three-mile boardwalk with rides at one end, bars at the other, and a ten-mile beach between. Senior week energy all summer, dead quiet and half price in September.",
  ["Fly into Salisbury or drive from BWI (2.5 hrs); the bus down the island is $4 a day","Assateague's wild ponies are 20 minutes south"],
  ["Day 1 — Boardwalk, Thrasher's, Trimper's rides at night","Day 2 — Beach all day, Seacrets at sunset","Day 3 — Assateague ponies, drive home"])
t("asburypark","Asbury Park","Springsteen's boardwalk, back and better",["music","beach","party"],2,270,"🎸","EWR","Asbury-Park--NJ","Asbury Park","Asbury Park, NJ",40.22,-74.01,
  "The Stone Pony is still here, the boardwalk got its arcade and its bars back, and the beach is a block from a hundred record shops and taco spots. An hour from Newark by train.",
  ["NJ Transit from New York Penn is $17 — skip the car","Stone Pony Summer Stage shows are outdoors and cheap"],
  ["Day 1 — Boardwalk, Asbury Lanes, a show at the Stone Pony","Day 2 — Beach morning, Cookman Ave brunch, train back"])
t("atlanticcity","Atlantic City","The boardwalk, the casinos, the cheap room",["party","beach"],2,240,"🎰","ACY","Atlantic-City--NJ","Atlantic City","Atlantic City, NJ",39.36,-74.42,
  "Casino rooms go for almost nothing midweek, the boardwalk is four miles long, and the beach is free. Go for the spectacle, not the odds.",
  ["Book casino hotels Sunday to Thursday — rooms drop to $60","Spirit flies into ACY from Florida for pocket change"],
  ["Day 1 — Boardwalk, the Steel Pier, a casino show","Day 2 — Beach, Absecon Lighthouse, fly home"])
t("hudsonvalley","Hudson Valley","Trains, trails and farm dinners",["nature","culture","road"],3,340,"🍎","ALB","Beacon--NY","Beacon","Beacon, NY",41.5,-73.97,
  "Dia Beacon, the Breakneck Ridge scramble, cider farms, and towns like Cold Spring and Hudson that look like a film set. Metro-North gets you to all of it from the city.",
  ["Metro-North stops right at Breakneck Ridge and Beacon — no car for the hikes","Dia Beacon is one of the best art museums in the country, and it's $20"],
  ["Day 1 — Beacon: Dia, Main Street, Mount Beacon at sunset","Day 2 — Breakneck Ridge, Cold Spring, a farm dinner","Day 3 — Hudson antiques, Olana, home"])
t("lakeplacid","Lake Placid","Olympic town, High Peaks, a lake to jump in",["nature","road"],3,330,"🏔️","ALB","Lake-Placid--NY","Lake Placid","Lake Placid, NY",44.28,-73.98,
  "Two Winter Olympics in one small town. Bobsled rides, the ski jumps, 46 High Peaks to climb, and Mirror Lake right on Main Street. Summer or winter, it works.",
  ["The bobsled ride is $100 and it's the thing you'll talk about","Cascade Mountain is the easiest High Peak and the best first one"],
  ["Day 1 — Mirror Lake, Main Street, the Olympic Center","Day 2 — Cascade and Porter peaks","Day 3 — Whiteface or the bobsled, drive home"])
t("burlington","Burlington, VT","Lake Champlain, Church Street, maple everything",["culture","nature"],3,320,"🍁","BTV","Burlington--VT","Burlington","Burlington, VT",44.48,-73.21,
  "A college town on a lake with mountains on both sides. Church Street for the bars, the waterfront bike path for the day, Ben & Jerry's 30 minutes out.",
  ["Rent a bike and ride the Island Line causeway out into the lake","Ben & Jerry's factory tour is $6 and ends in ice cream"],
  ["Day 1 — Church Street, waterfront sunset over the Adirondacks","Day 2 — Island Line causeway bike ride, breweries","Day 3 — Stowe or Ben & Jerry's, fly home"])
t("portlandme","Portland, Maine","Lobster rolls and lighthouses",["culture","beach","nature"],3,340,"🦞","PWM","Portland--ME","Portland","Portland, ME",43.66,-70.26,
  "The Old Port's cobblestones, more breweries per person than anywhere in the US, Portland Head Light twenty minutes out, and a lobster roll on a dock for the price of a sandwich.",
  ["The island ferry to Peaks Island is $8 round trip and makes a whole day","Allagash and Bissell Brothers both do free tastings"],
  ["Day 1 — Old Port, Eastern Promenade, breweries","Day 2 — Portland Head Light, Two Lights, Cape Elizabeth","Day 3 — Peaks Island by ferry, fly home"])
t("providence","Providence, RI","Small city, big food, river on fire",["culture","party"],2,250,"🔥","PVD","Providence--RI","Providence","Providence, RI",41.82,-71.41,
  "Federal Hill for the Italian food, Thayer Street for the college nights, and on summer weekends they set the river on fire with WaterFire. Cheapest flight into New England most weeks.",
  ["Check the WaterFire schedule before you book — it's free and it's the reason to go","Brown and RISD mean cheap eats on Thayer Street"],
  ["Day 1 — Federal Hill dinner, WaterFire if it's lit","Day 2 — RISD Museum, Thayer Street, fly home"])
t("marthasvineyard","Martha's Vineyard","Ferry over, bikes out, gingerbread houses",["beach","nature"],3,420,"⛴️","BOS","Oak-Bluffs--MA","Oak Bluffs","Martha's Vineyard, MA",41.45,-70.56,
  "Take the ferry, leave the car. Oak Bluffs has the gingerbread cottages and the bars, Edgartown has the whaling-captain houses, and the Aquinnah cliffs are the end of the world.",
  ["Fly to Boston, bus to Woods Hole, ferry over — a car on the ferry costs more than your flight","Bike between the three towns, the paths are flat and paved"],
  ["Day 1 — Ferry to Oak Bluffs, the cottages, Circuit Ave at night","Day 2 — Bike to Edgartown, State Beach","Day 3 — Aquinnah cliffs, ferry back"])
t("poconos","The Poconos","Waterfalls, a lake, and a cabin with the crew",["nature","road"],3,260,"🌲","ABE","Stroudsburg--PA","Stroudsburg","Pocono Mountains, PA",41.0,-75.2,
  "Two hours from New York or Philly. Bushkill Falls, the Delaware Water Gap, Lake Wallenpaupack, and a cabin that splits to almost nothing with six people.",
  ["Rent one cabin with a hot tub and split it, it's the whole trip","Delaware Water Gap: the Mount Tammany loop is the view for the effort"],
  ["Day 1 — Bushkill Falls, cabin night","Day 2 — Mount Tammany, river tubing, Wallenpaupack","Day 3 — Jim Thorpe town, drive home"])
t("gettysburg","Gettysburg + Lancaster","Battlefield at dawn, farm stands by noon",["culture","road"],2,220,"🐎","MDT","Gettysburg--PA","Gettysburg","Gettysburg, PA",39.83,-77.23,
  "Drive the battlefield loop at sunrise with no one else out there, then an hour east into Amish farm country for the markets and the pies.",
  ["The battlefield auto tour is free; hire a licensed guide to ride in your car for $90 if you want the real version","Lancaster Central Market is Tuesday, Friday and Saturday only"],
  ["Day 1 — Battlefield at sunrise, Little Round Top, town at night","Day 2 — Lancaster farms and market, drive home"])
t("columbus","Columbus, OH","Short North, Buckeye Saturdays, cheap everything",["party","culture"],3,270,"🌰","CMH","Columbus--OH","Columbus","Columbus, OH",39.96,-83.0,
  "A college city with a bar strip (Short North) that goes all night, a German Village that looks like Bavaria, and a football Saturday that feels like a holiday.",
  ["Gallery Hop in the Short North is the first Saturday of the month","The Book Loft in German Village: 32 rooms of books, free to get lost in"],
  ["Day 1 — Short North, North Market, Gallery Hop","Day 2 — German Village, Schiller Park, a game if it's a Saturday","Day 3 — Franklin Park Conservatory, fly home"])
t("cincinnati","Cincinnati","Chili, the Reds, and a riverside skyline",["culture","party"],2,250,"🌭","CVG","Cincinnati--OH","Cincinnati","Cincinnati, OH",39.1,-84.51,
  "Over-the-Rhine is the best-preserved 1800s neighborhood in the country and it's full of beer halls. Walk the Roebling Bridge at night, eat the chili on spaghetti, don't ask why.",
  ["Reds tickets go for $10 on weeknights","Findlay Market is the cheapest lunch in town"],
  ["Day 1 — Over-the-Rhine, Findlay Market, a Reds game","Day 2 — Roebling Bridge, Smale Park, Skyline Chili, fly home"])
t("detroit","Detroit","Motown, murals, a comeback you can feel",["music","culture"],3,290,"🎶","DTW","Detroit--MI","Detroit","Detroit, MI",42.33,-83.05,
  "The Motown Museum is a house where Marvin Gaye recorded. Then Eastern Market, the Heidelberg Project, Belle Isle on the river, and a food scene that's suddenly serious.",
  ["Motown Museum tours sell out — book the week before","The DIA is free for Michigan residents and $14 for everyone else; the Rivera murals alone are worth it"],
  ["Day 1 — Motown Museum, Eastern Market, Corktown at night","Day 2 — DIA, Heidelberg Project, Belle Isle sunset","Day 3 — Riverwalk, fly home"])
t("milwaukee","Milwaukee","Beer, brats, and a lakefront that surprises",["party","culture"],2,240,"🍺","MKE","Milwaukee--WI","Milwaukee","Milwaukee, WI",43.04,-87.91,
  "Cheaper than Chicago and 90 minutes away. Brewery tours with the beer included, a lakefront art museum that opens its wings at noon, and summer festivals every weekend.",
  ["Lakefront Brewery tour is $15 and comes with four beers and a glass","The Art Museum's wings open at 10, noon and close at 5 — be outside for it"],
  ["Day 1 — Third Ward, Lakefront Brewery, Brady Street at night","Day 2 — Art Museum, Bradford Beach, fly home"])
t("minneapolis","Minneapolis","Lakes in the city, Prince's house, the First Avenue stage",["music","culture","nature"],3,300,"💜","MSP","Minneapolis--MN","Minneapolis","Minneapolis, MN",44.98,-93.27,
  "Twenty-two lakes inside the city with bike paths around all of them. Paisley Park tours, a show at First Avenue, and the Walker's sculpture garden for free.",
  ["Nice Ride bikes are the way around the Chain of Lakes","First Avenue has a show almost every night — check the calendar before you book"],
  ["Day 1 — Stone Arch Bridge, Mill City, Northeast breweries","Day 2 — Chain of Lakes by bike, Walker sculpture garden","Day 3 — Paisley Park, First Ave show, fly home"])
t("madison","Madison, WI","Two lakes, one capitol, a Badger Saturday",["party","nature"],2,230,"🦡","MSN","Madison--WI","Madison","Madison, WI",43.07,-89.4,
  "The capitol sits on an isthmus between two lakes, State Street runs straight from it to the university, and the Memorial Union Terrace is the best beer on a lake in the country.",
  ["The Terrace chairs at Memorial Union are first come — get there by 5","Saturday farmers market around the capitol is the biggest in the US"],
  ["Day 1 — Capitol, State Street, the Terrace at sunset","Day 2 — Lake Monona bike loop, a game if it's fall, fly home"])
t("lexington","Lexington, KY","Bourbon country and horse farms",["culture","road"],3,310,"🥃","LEX","Lexington--KY","Lexington","Lexington, KY",38.04,-84.5,
  "Horse farms with white fences in every direction, and the Bourbon Trail starts here. Keeneland in April or October is the prettiest racetrack in America and $7 to get in.",
  ["Designate a driver or book a bourbon tour van — distilleries are spread out","Keeneland general admission is $7 and the morning workouts are free"],
  ["Day 1 — Keeneland or a horse farm tour, downtown distillery district","Day 2 — Woodford Reserve, Buffalo Trace (free tour), Frankfort","Day 3 — Red River Gorge day trip or fly home"])
t("knoxville","Knoxville","Smokies gateway with a real downtown",["music","nature"],3,280,"🎻","TYS","Knoxville--TN","Knoxville","Knoxville, TN",35.96,-83.92,
  "Market Square has live music most nights, the Old City has the bars, and the Great Smoky Mountains are 45 minutes away without the Gatlinburg crowds.",
  ["Stay in Knoxville and day-trip the Smokies — half the price of Gatlinburg","Ijams Nature Center has a quarry you can swim in, free"],
  ["Day 1 — Market Square, the Sunsphere, Old City at night","Day 2 — Smokies day trip: Cades Cove or Alum Cave","Day 3 — Ijams quarry, fly home"])
t("tulsa","Tulsa","Art deco, Route 66, Gathering Place",["music","culture"],2,240,"🛣️","TUL","Tulsa--OK","Tulsa","Tulsa, OK",36.15,-95.99,
  "The most art deco downtown outside of Miami, a $465M park on the river that's free, Route 66 running through it, and the Bob Dylan and Woody Guthrie centers next to each other.",
  ["Gathering Place is free and bigger than you think — give it an afternoon","Cain's Ballroom: see anything there, it's one of the great rooms"],
  ["Day 1 — Downtown deco walk, Guthrie + Dylan centers, Cain's show","Day 2 — Gathering Place, Route 66 diners, fly home"])
t("dallas","Dallas + Fort Worth","Deep Ellum nights, Stockyards days",["party","culture"],3,320,"🤠","DFW","Dallas--TX","Dallas","Dallas, TX",32.78,-96.8,
  "Deep Ellum for the live music and the murals, Bishop Arts for the brunch, and 30 minutes west the Fort Worth Stockyards still run cattle down the street twice a day.",
  ["The Stockyards cattle drive is at 11:30 and 4, free","Dallas Museum of Art is free; the Nasher next door is $12"],
  ["Day 1 — Deep Ellum, Dealey Plaza, Bishop Arts","Day 2 — Fort Worth: Stockyards, Billy Bob's","Day 3 — Klyde Warren Park, fly home"])
t("houston","Houston","Space Center, the best food city nobody talks about",["culture"],3,300,"🚀","IAH","Houston--TX","Houston","Houston, TX",29.76,-95.37,
  "The most diverse city in America eats like it. Viet-Cajun crawfish, Nigerian suya, the best Tex-Mex alive, then Space Center Houston and the museum district for free days.",
  ["Museum of Fine Arts and the Menil are free (the Menil always, MFAH on Thursdays)","Space Center: book online, go on a weekday"],
  ["Day 1 — Museum District, the Menil, Montrose at night","Day 2 — Space Center Houston, Galveston seawall sunset","Day 3 — Chinatown and Bellaire eating tour, fly home"])
t("albuquerque","Albuquerque","Balloons at dawn, Sandia at sunset",["culture","nature"],3,310,"🎈","ABQ","Albuquerque--NM","Albuquerque","Albuquerque, NM",35.08,-106.65,
  "The Balloon Fiesta in October is 500 balloons going up at once. The rest of the year: the Sandia tram to 10,000 feet, Old Town, green chile on everything, and Santa Fe an hour up the road.",
  ["Balloon Fiesta: book a year out or stay in Santa Fe and drive down for the dawn ascension","Sandia Peak Tramway at sunset, then the top-of-the-tram restaurant"],
  ["Day 1 — Old Town, Sandia tram at sunset","Day 2 — Petroglyphs, Breaking Bad spots, Nob Hill at night","Day 3 — Santa Fe or Tent Rocks, fly home"])
t("tucson","Tucson + Saguaro NP","Cactus forests and the best Mexican food in the US",["nature","culture"],3,300,"🌵","TUS","Tucson--AZ","Tucson","Tucson, AZ",32.22,-110.97,
  "Saguaro National Park on both sides of the city, Mount Lemmon from desert to pines in an hour, and a UNESCO food city — the Sonoran hot dog alone is worth the flight.",
  ["Saguaro NP is $25 a car for a week, both districts","Mount Lemmon is 30 degrees cooler than the city in summer"],
  ["Day 1 — Saguaro West, Desert Museum, Gates Pass sunset","Day 2 — Mount Lemmon, Fourth Avenue at night","Day 3 — Mission San Xavier, Sonoran dogs, fly home"])
t("phoenix","Phoenix + Scottsdale","Pool days, Camelback at dawn, Old Town at night",["party","nature"],3,340,"☀️","PHX","Scottsdale--AZ","Scottsdale","Phoenix, AZ",33.45,-112.07,
  "Hike Camelback before the heat, pool all afternoon, Old Town Scottsdale all night. Spring training in March is the cheapest baseball you'll ever see.",
  ["Hike before 7am from October to April; don't hike at all in July","Spring training tickets from $10 — 15 teams within 30 minutes"],
  ["Day 1 — Camelback sunrise, pool, Old Town Scottsdale","Day 2 — Desert Botanical Garden, Roosevelt Row, a game","Day 3 — Papago Park, fly home"])
t("saltlake","Salt Lake City","Five ski resorts in 40 minutes",["nature"],3,360,"⛷️","SLC","Salt-Lake-City--UT","Salt Lake City","Salt Lake City, UT",40.76,-111.89,
  "Snowbird, Alta, Brighton, Solitude and Park City all within 40 minutes of the airport. Summer: the same canyons for hiking, plus the Great Salt Lake at sunset.",
  ["Ski Brighton or Solitude — half the price of Park City, same snow","Summer: Big Cottonwood Canyon trails are free and 25 minutes from downtown"],
  ["Day 1 — Land, drive straight to the canyon","Day 2 — Ski or hike all day, downtown at night","Day 3 — Antelope Island bison, fly home"])
t("boise","Boise","River floats, foothills, a surprising downtown",["nature","party"],3,300,"🥔","BOI","Boise--ID","Boise","Boise, ID",43.62,-116.2,
  "Float the Boise River through the middle of town for $20, hike the foothills from downtown, then a bar scene that's grown up fast. Nobody expects it, everybody leaves happy.",
  ["Barber Park to Ann Morrison: the float is 2 hours, tubes rent for $15","Table Rock at sunset, 20 minutes up from downtown"],
  ["Day 1 — Float the river, Freak Alley, downtown at night","Day 2 — Foothills trails, the Basque Block","Day 3 — Bogus Basin or the Greenbelt, fly home"])
t("anchorage","Anchorage","Glaciers, moose, and 20 hours of daylight",["nature"],4,620,"🐻","ANC","Anchorage--AK","Anchorage","Anchorage, AK",61.22,-149.9,
  "Summer flights to Alaska are cheaper than people think. Moose in the city park, a glacier an hour south, Denali a day north, and sunlight until midnight in June.",
  ["Go June to August; the Seward Highway to Portage Glacier is the drive","The Coastal Trail from downtown is 11 miles of moose and mountain views, free"],
  ["Day 1 — Coastal Trail, Flattop Mountain","Day 2 — Seward Highway, Portage Glacier, Girdwood","Day 3 — Kenai Fjords boat from Seward","Day 4 — Back to Anchorage, fly home"],canDrive=False)
t("kauai","Kauai","The Na Pali coast and not much else, perfect",["beach","nature"],5,980,"🌺","LIH","Kapaa--HI","Kapaa","Kauai, HI",22.05,-159.33,
  "The least built-up of the big islands. Na Pali by boat or by foot, Waimea Canyon, Hanalei Bay, and a north shore that still feels like the 70s.",
  ["Kalalau Trail: the first 2 miles to Hanakapiai Beach need no permit, just a parking reservation","Stay in Kapaa — middle of the island, cheapest base"],
  ["Day 1 — Land, Kapaa, Lydgate beach","Day 2 — Na Pali boat tour","Day 3 — Waimea Canyon, Polihale Beach","Day 4 — Hanalei, Ke'e Beach, Kalalau first 2 miles","Day 5 — Poipu, fly home"],canDrive=False)
t("palmsprings","Palm Springs","Pool, mid-century, Joshua Tree an hour out",["party","nature"],3,380,"🌴","PSP","Palm-Springs--CA","Palm Springs","Palm Springs, CA",33.83,-116.55,
  "Rent a mid-century house with a pool and split it. The Aerial Tramway goes from desert to snow in ten minutes, and Joshua Tree is an hour away.",
  ["A 4-bedroom with a pool split six ways beats any hotel","Tramway to Mount San Jacinto: $30, bring a jacket, it's 40 degrees cooler"],
  ["Day 1 — Pool, downtown, Arenas Road at night","Day 2 — Aerial Tramway, Indian Canyons","Day 3 — Joshua Tree day trip, fly home"])
t("santabarbara","Santa Barbara","The American Riviera on a budget",["beach","culture"],3,400,"🏄","SBA","Santa-Barbara--CA","Santa Barbara","Santa Barbara, CA",34.42,-119.7,
  "Red-tile roofs, a mission, a pier, and a wine country twenty minutes away. The Funk Zone has the tasting rooms, the beach is free, and the courthouse tower view costs nothing.",
  ["Courthouse clock tower: free, best view in the city","Amtrak from LA runs along the ocean and costs $30"],
  ["Day 1 — Stearns Wharf, the Funk Zone, courthouse tower","Day 2 — Mission, Inspiration Point hike, State Street","Day 3 — Santa Ynez wine country, fly home"])
t("napa","Napa + Sonoma","Wine country without the wine-country bill",["culture","road"],3,420,"🍷","SFO","Napa--CA","Napa","Napa, CA",38.3,-122.29,
  "Skip the $75 tastings. Sonoma's small producers pour for $20, Oxbow Market in Napa does lunch, and the drive up Highway 29 is the point anyway.",
  ["Sonoma side is cheaper than Napa, same grapes","Many tasting fees are waived if you buy one bottle — split it"],
  ["Day 1 — Oxbow Market, two Napa tastings, downtown Napa","Day 2 — Sonoma Plaza, Healdsburg, Russian River","Day 3 — Calistoga hot springs, drive to SFO"])
t("bend","Bend, Oregon","Breweries, the Deschutes, Smith Rock",["nature","party"],3,340,"🧗","RDM","Bend--OR","Bend","Bend, OR",44.06,-121.32,
  "Float the river through town, climb or just gawk at Smith Rock, ski Bachelor in winter, and drink your way down the Bend Ale Trail. Mountain town energy, real food.",
  ["The Ale Trail passport is free and gets you swag after 10 breweries","Smith Rock day-use is $5; go at sunrise"],
  ["Day 1 — Float the Deschutes, Old Mill, Crux at sunset","Day 2 — Smith Rock, Tumalo Falls","Day 3 — Mount Bachelor or Lava Lands, fly home"])
t("coeurdalene","Coeur d'Alene + Spokane","A lake you'll think about for a year",["nature"],3,320,"🚤","GEG","Coeur-d'Alene--ID","Coeur d'Alene","Coeur d'Alene, ID",47.68,-116.78,
  "Fly into Spokane, drive 35 minutes to one of the prettiest lakes in the country. Tubey Beach, the world's longest floating boardwalk, and Spokane's riverfront park for the city day.",
  ["Rent a pontoon for the afternoon and split it 8 ways","Spokane's Riverfront Park and falls are free and right downtown"],
  ["Day 1 — Spokane falls, Riverfront Park, drive to the lake","Day 2 — Lake all day, Tubbs Hill trail, the boardwalk at sunset","Day 3 — Mineral Ridge hike, fly home"])
t("mobile","Mobile, AL","The original Mardi Gras, oysters, moss",["culture","party"],2,220,"🎭","MOB","Mobile--AL","Mobile","Mobile, AL",30.69,-88.04,
  "Mardi Gras started here, not New Orleans, and the parades run three weeks with half the crowd. The rest of the year: Spanish moss, oysters on the half shell, and the USS Alabama.",
  ["Mardi Gras in Mobile is family-friendly and free — stake out Government Street","Dauphin Island is 45 minutes south for a beach day"],
  ["Day 1 — Downtown, Dauphin Street bars, a parade if it's the season","Day 2 — USS Alabama, Bellingrath Gardens, drive home"])
t("biloxi","Biloxi + Gulf Coast","Casinos on the sand, shrimp off the boat",["beach","party"],3,260,"🦐","GPT","Biloxi--MS","Biloxi","Biloxi, MS",30.4,-88.89,
  "Twenty-six miles of beach, casino hotels that practically pay you to stay midweek, and shrimp boats pulling up to the docks. Ship Island by ferry is the real beach.",
  ["Casino rooms Sunday to Thursday are the cheapest beds on the Gulf","Ship Island ferry: $40, white sand, no development"],
  ["Day 1 — Beach, the casinos, Ocean Springs at night","Day 2 — Ship Island ferry all day","Day 3 — Bay St. Louis, drive home"])
t("jacksonville","Jacksonville Beach","Florida's quiet surf town",["beach","party"],2,180,"🏄","JAX","Jacksonville-Beach--FL","Jacksonville Beach","Jacksonville Beach, FL",30.29,-81.39,
  "Twenty-two miles of beach with a pier, a surf break, and bars that don't charge a cover. Atlantic Beach next door is where the locals eat. Cheap because it's Jacksonville.",
  ["Stay in Atlantic Beach or Neptune Beach, walk to Jax Beach bars","Little Talbot Island State Park is 30 minutes north and empty"],
  ["Day 1 — Jax Beach pier, surf lesson, Atlantic Beach town center at night","Day 2 — Little Talbot Island, Kathryn Abbey Hanna Park, home"])
t("fortlauderdale","Fort Lauderdale","The canals, the beach, the Las Olas bar crawl",["beach","party"],3,320,"🛥️","FLL","Fort-Lauderdale--FL","Fort Lauderdale","Fort Lauderdale, FL",26.12,-80.14,
  "Miami's calmer cousin: a wide beach with a real promenade, 165 miles of canals to boat, and Las Olas for the night. Fort Lauderdale airport is usually the cheapest in South Florida.",
  ["Water taxi all-day pass is $40 and it's the best way to see the canals","Hugh Taylor Birch State Park: beach, lagoon, $6"],
  ["Day 1 — The beach, A1A promenade, Las Olas at night","Day 2 — Water taxi, Hugh Taylor Birch, Wilton Manors","Day 3 — Everglades airboat or Lauderdale-by-the-Sea, fly home"])
t("naples","Naples + Marco Island","The pier sunset and the shelling beaches",["beach","nature"],3,340,"🐚","RSW","Naples--FL","Naples","Naples, FL",26.14,-81.8,
  "The Naples pier sunset is the whole town's nightly event. Then Marco Island's beaches for shelling, Ten Thousand Islands by kayak, and Fifth Avenue for the dress-up dinner.",
  ["Go May or September — half the winter price","Tigertail Beach on Marco: wade the lagoon to the sandbar"],
  ["Day 1 — Naples pier sunset, Fifth Avenue","Day 2 — Marco Island, Tigertail, shelling","Day 3 — Ten Thousand Islands kayak, fly home"])
t("daytona","Daytona Beach","Drive on the sand, race on the oval",["beach","party"],2,200,"🏎️","DAB","Daytona-Beach--FL","Daytona Beach","Daytona Beach, FL",29.21,-81.02,
  "You can literally drive your car on the beach. The Speedway tour puts you on the banking, the boardwalk has the rides and the bars, and it's an hour from Orlando's airport.",
  ["Beach driving is $20 a day and it's the thing to do once","Speedway tours from $25; race weeks are a different, louder trip"],
  ["Day 1 — Drive on the beach, the pier, boardwalk at night","Day 2 — Speedway tour, Ponce Inlet lighthouse, home"])
t("littlerock","Little Rock","River trails, the Clinton library, Hot Springs an hour out",["culture","nature"],2,230,"🏛️","LIT","Little-Rock--AR","Little Rock","Little Rock, AR",34.75,-92.29,
  "The Arkansas River Trail, Central High's civil rights history, the Clinton Presidential Center, and the Hot Springs bathhouses an hour down the road.",
  ["Central High visitor center is free and it's the one that matters","Pinnacle Mountain is a 20-minute drive and a 90-minute climb"],
  ["Day 1 — Central High, Clinton Center, River Market at night","Day 2 — Pinnacle Mountain, Big Dam Bridge, fly home"])
def js(v):
    return json.dumps(v, ensure_ascii=False)
out=[]
for x in T:
    line1=f'{{ id:{js(x["id"])}, photo:{js("photos/"+x["id"]+".jpg")}, name:{js(x["name"])}, tag:{js(x["tag"])}, vibes:{js(x["vibes"])}, days:{x["days"]}, cost:{x["cost"]}, img:{js(x["img"])},'
    line2=f'  fly:{js(x["fly"])}, {"canDrive:true, " if x["canDrive"] else ""}stay:{js(x["stay"])}, stayName:{js(x["stayName"])}, city:{js(x["city"])}, lat:{x["lat"]}, lon:{x["lon"]},'
    line3=f'  blurb:{js(x["blurb"])},'
    line4=f'  hacks:{js(x["hacks"])},'
    line5=f'  plan:{js(x["plan"])} }},'
    out.append("\n".join([line1,line2,line3,line4,line5]))
block="/* ---- added Nov 20 2026: 50 more US sends (Virginia Beach, Salem, the Mid-Atlantic, Midwest, Southwest, Gulf) ---- */\n"+"\n".join(out)+"\n"
p='src/data/trips.js'; s=open(p).read()
i=s.index('\n];', s.index('export const TRIPS'))
s=s[:i+1]+block+s[i+1:]
open(p,'w').write(s)
print(len(T),'trips added')
