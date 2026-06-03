insert into "global_topics" ("id", "name", "description", "significance_score") values
  ('01', 'arts, culture, entertainment and media', 'All forms of arts, entertainment, cultural heritage and media', 0.31),
  ('02', 'crime, law and justice', 'The establishment and statement of the rules of behavior in society, the enforcement of these rules, breaches of the rules, the punishment of offenders and the organizations and bodies involved in these activities', 0.84),
  ('03', 'disaster, accident and emergency incident', 'Man made or natural event resulting in loss of life or injury to living creatures and or damage to objects or property', 0.95),
  ('04', 'economy, business and finance', 'All matters concerning the planning, production and exchange of wealth', 0.68),
  ('05', 'education', 'All aspects of furthering knowledge, formally or informally', 0.44),
  ('06', 'environment', 'The protection, damage, and condition of the ecosystem of the planet Earth and its surroundings', 0.71),
  ('07', 'health', 'All aspects of physical and mental well-being', 1.00),
  ('08', 'human interest', 'Items that discuss individuals, groups, animals, plants or objects in an emotional way', 0.15),
  ('09', 'labor', 'Social aspects, organizations, rules and conditions affecting employment and economic support of the unemployed', 0.55),
  ('10', 'lifestyle and leisure', 'Activities undertaken for pleasure, relaxation or recreation outside paid employment, including eating and travel', 0.24),
  ('11', 'politics and government', 'Local, regional, national and international exercise of power and day-to-day running of government', 0.68),
  ('12', 'religion', 'Belief systems, institutions and people who provide moral guidance to followers', 0.34),
  ('13', 'science and technology', 'All aspects pertaining to scientific understanding and research of natural, formal and social sciences', 0.51),
  ('14', 'society', 'Concerns, issues, affairs and institutions relevant to human social interactions, problems and welfare', 0.43),
  ('15', 'sport', 'Competitive activity or skill involving physical and or mental effort and related organizations', 0.24),
  ('16', 'conflict, war and peace', 'Protest or violence, military activities, geopolitical conflicts, and resolution efforts', 0.96),
  ('17', 'weather', 'The study, prediction and reporting of meteorological phenomena', 0.50)
on conflict ("id") do update
set
  "name" = excluded."name",
  "description" = excluded."description",
  "significance_score" = excluded."significance_score";
