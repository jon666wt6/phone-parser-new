# db/seeds.rb
# frozen_string_literal: true

# Each operator is followed by its list of regions from the text block
REGION_DATA = <<~DATA
======================
beeline

adygeya
sarov
semiluki
vniissok
kotelniki
serpukhov
kazan
rostovskaya-obl
stupino
rostov-na-donu
berezovskiy
aleksin
maykop
tulskaya-obl
verkhnee-dubrovo
buryatiya
lobnya
voronezhskaya-obl
vichuga
syktyvkar
ryazan
nekrasovka
petergof
rostov
smolenskaya
tomskaya-obl
mineralnye-vody
tagil
balakovo
bryanskaya-obl
stavropol
yartsevo
naro-fominsk
afonino
kaluzhskaya-obl
essentuki
zelenograd
shushary
rzhev
mendeleevo
petropavlovsk-kamchatskiy
sarapul
kurganskaya-obl
kirovskaya-obl
kostroma
orlovskaya-obl
kareliya
kirov
krasnoe-selo
reutov
monino
anadyr
domodedovo
lyubertsy
bryansk
nazran
aksay
pervouralsk
kineshma
novokuznetsk
izhevsk
dagestan
revda
tambovskaya-obl
russko-vysotskoe
engels
yakutsk
nakhabino
orenburg
tyumen
bataysk
tverskaya-obl
malechkino
penzenskaya-obl
sestroretsk
pskov
samarskaya-obl
nizhegorodskaya-obl
krasnogorsk
taganrog
kurskaya-obl
cherepovets
saphonovo
cherkessk
saratovskaya-obl
chukotskiy-ao
kiselevsk
kaliningrad
severnaya-osetiya
kostromskaya-obl
norilsk
pavlovsk
novomoskovsk
elista
surgut
amurskaya-obl
essentukskaya-stanitsa
divnogorsk
kiselevka
rodnye-prostory
tolyatti
pyatigorsk
yanao
ivanteevka
chuvashiya
ulyanovskaya-obl
evreyskaya-ao
voronezh
bashkortostan
permskiy-kr
tyva
pargolovo
pskovskaya-obl
zheleznodorozhnyy
gorelovo
kaliningradskaya-obl
vladikavkaz
kudrovo
zarechye
ufa
shuya
dzerzhinsk
artem
omsk
kemerovo
shchekino
kemerovskaya-obl
arkhangelskaya-obl
vologodskaya-obl
pushchino
chita
astrakhan
goryachevodskiy
metallostroy
vladimirskaya-obl
cheboksary
zhukovskiy
mytishchi
zheleznovodsk
mikhaylovsk
khabarovsk-kr
krasnoe-na-volge
noginsk
komi
tver
orenburgskaya-obl
georgievsk
kyzyl
krasnoyarsk
dzerzhinskiy
sakhalinskaya-obl
magadan
severodvinsk
pushkin
arzamas
gatchina
salekhard
orel
penza
oktyabrskiy
kamchatskiy-kr
kurchatov
vorotynsk
samara
bogoroditsk
novgorodskaya-obl
gorno-altaysk
dolgoprudnyy
sholokhovo
karachaevo-cherkesiya
nizhniy-novgorod
khimki-kurkino
ryazanskaya-obl
kamyzyak
khanty-mansiysk
tambov
myski
narimanov
dimitrovgrad
makhachkala
ekaterinburg
ulan-ude
noyabrsk
yaroslavl
ivanovo
tyumenskaya-obl
kursk
rybinsk
saratov
kondratovo
saransk
elektrostal
v-temernitsky
novaya-usman
irkutsk
bor
volzhsky
pushkino
magadanskaya-obl
volgogradskaya-obl
udmurtiya
balashikha
kashira
chechnya
nemchinovka
nalchik
kalmykiya
altayskiy-kr
arkhangelsk
solnechnogorsk
kislovodsk
volgorechensk
petrozavodsk
shchelkovo
yaroslavskaya-obl
uzlovaya
kolpino
korsakov
moskovskaya-obl
moskovskiy
krasnoyarskiy-kr
novosibirskaya-obl
chelyabinsk
chelyabinskaya-obl
krasnodar
moskva
novosibirsk
spb
khmao
innopolis
abakan
stavropolskiy-kr
pervomayskiy
altay
khimki
kazan-tatarstan
ramenskoe
volgograd
yoshkar-ola
zelenodolsk
chekhov
kronshtadt
voskresensk
altuhovka
deryabiha
mtsensk
aprelevka
korolev
khakasiya
egorevsk
leningradskaya-obl
murmashi
tonshalovo
kaluga
sredneuralsk
primorskiy-kr
blagoveshchensk
achinsk
kabardino-balkariya
magnitogorsk
balahna
vladivostok
balashov
holmsk
verkhnyaya-pyshma
khabarovsk
mariy-el
zheleznogorsk-kurskaya-obl
ingushetiya
shatura
dmitrov
sochi
murmansk
topolevo
lipetsk
vidyaevo
yuzhno-sakhalinsk
novodvinsk
tomsk
podolsk
nerekhta
sosnovoborsk
omskaya-obl
desnogorsk
sergiev-posad
ulyanovsk
orekhovo-zuevo
balashikha-22-mr
mordoviya
putilkovo
irkutskaya-obl
vologda
kokhma
sertolovo
taymyrskiy-mr
karavaevo
murmanskaya-obl
barnaul
tula
komsomolsk-na-amure
vyazma
astrakhanskaya-obl
safonovo
dolinsk
gorodische
tutaev
kola
zabaykalskiy-kr
severomorsk
ivanovskaya-obl
lipetskaya-obl
vsevolozhsk
vladimir
jilina
perm
zelenogorsk
yakutiya
groznyy
smolensk
vyksa
belovo
velikiy-novgorod
izobilnyy
birobidzhan
odintsovo
zhigulevsk
novouralsk
volgodonsk
belgorodskaya-obl
klin
belgorod
likino-dulevo
novorossiysk
pavlovskiy-posad
sverdlovskaya-obl
murino
kurgan

======================
megafon

vologda
nkz
mariel
chita
vrn
xmao
buryatia
kurgan
chukotka
nsk
prim
mordovia
pskov
ingushetia
rostov
chuvashia
kras
moscow
kstr
novgorod
tyumen
nn
perm
lc
kalmykia
brn
chechnya
tmb
saratov
krasnodar
kchr
adygea
astrakhan
yanao
ulyanovsk
samara
yar
omsk
tver
rzn
volgograd
tatarstan
kamchatka
orenburg
orl
bashkortostan
komi
penza
tula
alania
kis
kbr
svr
hakas
tom
arhangelsk
skh
amur
vl
spb
ks
tyva
bel
altay
sml
klg
kem
altrep
eao
stavropol
iv
chelny
chel
kaliningrad
karelia
magadan
kirov
irkutsk
murmansk
dagestan
sakha
khb
udm

======================
mts

bashkortostan
moskva
spb
zhukovski
yugra
vologda
bryansk
kemerovo
kras
lipetsk
chukotka
kurgan
golicino
tatarstan
arkhangelsk
norilsk
kaliningrad
tomsk
vladimir
magas
kchr
penza
kbr
khakasia
volgograd
sakha
komi
kostroma
magnitogorsk
samara
tyva
bronnitsy
lobnya
tambov
nov
sakh
ryazan
alania
nsk
elista
nnov
s-posad
nao
buryatia
mari-el
e-burg
kirov
stavropol
dagestan
tyumen
mordovia
smolensk
reutov
saratov
tver
mytishi
sbor
ramenskoe
chehov
khimki
belgorod
kursk
novokuznetsk
orenburg
pushkino
voronezh
irkutsk
orel
rnd
komsomolsk
chita
eao
astrakhan
murmansk
karelia
primorye
yaroslavl
omsk
yamal
khv
barnaul
amur
magadan
perm
balashiha
kamchatka
odintsovo
uln
altai
chuvashia
chel
pskov
miass
ivanovo
chechnya
kuban
tula
udm
solnechnogorsk
kaluga
vidnoe

======================
t2

vologda
kursk
magadan
uln
sakhalin
arh
arh
samara
tambov
kamchatka
yanao
kuzbass
ivanovo
ivanovo
pskov
vologda
smolensk
rostov
vladivostok
buryatia
kaluga
khakasia
omsk
nnov
mordovia
mariel
barnaul
krasnodar
tula
orel
spb
spb
chuvashia
penza
kostroma
karelia
yar
rostov
irkutsk
irkutsk
norilsk
nnov
volgograd
kaliningrad
kaliningrad
perm
komi
kurgan
novgorod
tyumen
izhevsk
hmao
ryazan
ekt
eao
eao
tomsk
msk
barnaul
ekt
tver
vladimir
vladimir
bryansk
bryansk
kazan
khabarovsk
belgorod
belgorod
murmansk
saratov
msk
msk
voronezh
voronezh
krasnoyarsk
kirov
lipetsk
orenburg
chelyabinsk
chelyabinsk
altai
volgograd
novosibirsk

======================
yota
2080
2048
2078
2073
2068
2029
2061
2056
2065
2021
2036
2019
2040
2067
2054
2031
2064
2003
2025
2077
2070
2008
2034
2049
2011
2045
2026
2052
2037
2072
2032
2024
2074
2060
2010
2066
2041
2027
2022
2044
2055
2076
2047
2033
2071
2075
2082
2057
2050
2069
2004
2051
2017
2062
2063
2039
2038
2059
2043
2042
2020
2013
2079
2006
2015
2046
2081
2058
2035
2001
2005
2009
2016
2030
2028
2014
2023
2007
2053
2002
DATA

puts "Seeding regions…"

current_operator = nil
REGION_DATA.each_line do |line|
  line.strip!
  next if line.empty?
  next if line.start_with?('===')

  # Detect operator headers
  case line.downcase
  when 'beeline', 'megafon', 'mts', 't2', 'yota'
    current_operator = line.downcase
    next
  end

  # Skip until operator is known
  next unless current_operator

  # Create region record
  Region.find_or_create_by!(
    region: line,
    operator: current_operator
  ) do |r|
    r.last_parsed_number = 0
    r.mask = '0'
    r.mask_length = 0
    r.price = nil
    r.full_name = nil
    r.processing = false
  end
end

puts "Regions seeded: #{Region.count}"

puts "Seeding proxy…"

proxy_str = "res-eu.lightningproxies.net:9999:yakogjcsrawwqsv179303-zone-lightning-region-ru:iypfvxthfn"

host, port, user, pass = proxy_str.strip.split(":")
url = "#{host}:#{port}"

Proxy.find_or_create_by!(
  url: url
) do |p|
  p.username = user
  p.password = pass
  p.type = "lightning"
  p.status = "active"
  p.rotating = false
  p.created_at = Time.current
  p.updated_at = Time.current
end

puts "Proxy seeded: #{Proxy.count}"


puts "Seeding Proxy6 proxies…"

proxy6_list = <<~PROXIES
  31.129.21.195:9099:d8qkDx:95z4BQ
  185.80.151.218:9267:d8qkDx:95z4BQ
  193.233.170.124:9612:d8qkDx:95z4BQ
  185.128.214.113:9242:d8qkDx:95z4BQ
  185.147.130.33:9509:d8qkDx:95z4BQ
  193.233.60.210:9327:d8qkDx:95z4BQ
  185.191.142.100:9929:d8qkDx:95z4BQ
  193.233.170.126:9991:d8qkDx:95z4BQ
  185.184.78.198:9653:d8qkDx:95z4BQ
  185.194.106.202:9486:d8qkDx:95z4BQ
  185.184.77.42:9124:d8qkDx:95z4BQ
  192.144.7.252:9558:d8qkDx:95z4BQ
  46.8.248.182:9912:d8qkDx:95z4BQ
  185.191.142.35:9468:d8qkDx:95z4BQ
  185.191.142.48:9365:d8qkDx:95z4BQ
  185.80.150.37:9980:d8qkDx:95z4BQ
  185.80.149.30:9500:d8qkDx:95z4BQ
  185.128.212.244:9071:d8qkDx:95z4BQ
  185.128.215.155:9318:d8qkDx:95z4BQ
  185.128.212.218:9001:d8qkDx:95z4BQ
  185.200.170.92:9610:d8qkDx:95z4BQ
  185.148.27.42:9259:d8qkDx:95z4BQ
  185.66.15.234:9567:d8qkDx:95z4BQ
  185.184.77.111:9817:d8qkDx:95z4BQ
  185.128.215.79:9373:d8qkDx:95z4BQ
  185.39.149.6:9081:d8qkDx:95z4BQ
  185.128.212.92:9353:d8qkDx:95z4BQ
  185.126.84.47:9026:d8qkDx:95z4BQ
  185.200.170.75:9250:d8qkDx:95z4BQ
  185.192.109.187:9171:d8qkDx:95z4BQ
  193.233.170.161:9637:d8qkDx:95z4BQ
  185.148.25.230:9643:d8qkDx:95z4BQ
  185.148.24.103:9354:d8qkDx:95z4BQ
  193.233.62.111:9708:d8qkDx:95z4BQ
  185.80.151.2:9785:d8qkDx:95z4BQ
  193.233.62.81:9296:d8qkDx:95z4BQ
  185.126.87.129:9635:d8qkDx:95z4BQ
  185.126.86.37:9576:d8qkDx:95z4BQ
  185.80.151.131:9480:d8qkDx:95z4BQ
PROXIES

proxy6_list.each_line do |line|
  line.strip!
  next if line.empty?

  host, port, username, password = line.split(":")
  url = "#{host}:#{port}"

  Proxy.find_or_create_by!(url: url) do |p|
    p.username = username
    p.password = password
    p.type = "proxy6"
    p.status = "active"
    p.rotating = false
    p.created_at = Time.current
    p.updated_at = Time.current
  end
end

puts "Proxy6 proxies seeded: #{Proxy.where(type: 'proxy6').count}"

puts "Seeding region masks..."

# Find all regions that are currently marked for processing
regions_to_process = Region.where(processing: true)

if regions_to_process.empty?
  puts "No regions found with processing: true. Nothing to seed."
  exit
end

# To make this script re-runnable, you can optionally destroy existing masks
# for the regions you are about to process.
puts "Destroying existing masks for processing regions..."
RegionMask.where(region_id: regions_to_process.pluck(:id)).destroy_all

regions_to_process.each do |region|
  mask_length = region.mask_length
  if mask_length.nil? || mask_length <= 0
    puts "Skipping Region ##{region.id} due to invalid mask_length: #{mask_length}"
    next
  end

  puts "Generating masks for Region ##{region.id} (mask_length: #{mask_length})..."

  # Calculate the total number of permutations (e.g., length 4 is 10^4 = 10,000)
  limit = 10**mask_length

  # Prepare an array of hashes for bulk insertion
  masks_to_insert = []
  current_time = Time.current

  (0...limit).each do |i|
    # Format the number as a string with leading zeros (e.g., 5 -> "0005")
    mask_string = i.to_s.rjust(mask_length, "0")
    masks_to_insert << {
      region_id: region.id,
      mask: mask_string,
      is_complete: false,
      created_at: current_time,
      updated_at: current_time,
    }
  end

  # Perform a single, efficient bulk insert for all masks of this region
  if masks_to_insert.any?
    puts "Bulk inserting #{masks_to_insert.length} masks for Region ##{region.id}..."
    RegionMask.insert_all(masks_to_insert)
  end
end

puts "✅ Seeding region masks completed."